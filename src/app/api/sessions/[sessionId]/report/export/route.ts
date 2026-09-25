import { marked } from "marked";
import { NextResponse } from "next/server";
import { ensureDatabaseReady, prisma } from "@/lib/db";
import { requireSessionAccess } from "@/lib/instructor-auth";
import { launchPdfBrowser } from "@/lib/pdf-browser";
import { getReportFreshness } from "@/lib/report-freshness";
import { parseTeachingBrief } from "@/lib/teaching-brief";
import { prepareNarrativeForExport } from "@/lib/report-presentation";
import { buildTeachingBriefExportHtml } from "@/lib/teaching-brief-export";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  let browser: Awaited<ReturnType<typeof launchPdfBrowser>> | null = null;

  try {
    const { sessionId } = await params;
    const access = await requireSessionAccess(sessionId, "viewer");
    if (!access.ok) return access.response;

    await ensureDatabaseReady();
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) return new NextResponse("Session not found", { status: 404 });

    const report = await prisma.report.findFirst({
      where: { sessionId },
      orderBy: { generatedAt: "desc" },
    });
    if (!report) {
      return new NextResponse("Report not found. Generate one first.", { status: 404 });
    }

    const { stale } = await getReportFreshness(sessionId, report);
    if (stale) {
      return new NextResponse(
        "This teaching brief is older than the current evidence or review state. Ask an owner or editor to refresh it before exporting.",
        { status: 409 }
      );
    }

    const brief = parseTeachingBrief(report.structuredContent);
    if (!brief) {
      return new NextResponse(
        "This report predates structured teaching briefs. Regenerate it before exporting.",
        { status: 409 }
      );
    }

    const narrativeHtml = await marked(prepareNarrativeForExport(report.content), { gfm: true });
    const html = buildTeachingBriefExportHtml({
      sessionName: session.name,
      narrativeHtml,
      brief,
    });

    browser = await launchPdfBrowser();
    const page = await browser.newPage();
    await page.setJavaScriptEnabled(false);
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate:
        '<div style="font-size:8px;width:100%;text-align:center;color:#77736b">AI_demo teaching brief</div>',
      footerTemplate:
        '<div style="font-size:8px;width:100%;text-align:center;color:#77736b"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
      margin: { top: "24mm", right: "16mm", bottom: "25mm", left: "16mm" },
    });

    const safeName = session.name
      .replace(/[^a-z0-9]+/gi, "_")
      .replace(/^_+|_+$/g, "")
      .toLowerCase();
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="teaching-brief-${safeName || "session"}.pdf"`,
        "Content-Type": "application/pdf",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: unknown) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      {
        error:
          "We could not create the PDF. Please return to the teaching brief and try again.",
      },
      {
        status: 500,
        headers: { "Cache-Control": "private, no-store" },
      }
    );
  } finally {
    await browser?.close();
  }
}
