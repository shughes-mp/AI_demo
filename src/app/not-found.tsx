import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#f5f4f1] px-6 py-20 text-[#292724]">
      <section className="mx-auto max-w-2xl border border-[#d8d4cd] bg-white p-10">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#087f96]">
          Page not found
        </p>
        <h1 className="font-serif text-5xl leading-tight">This link has wandered off.</h1>
        <p className="mt-5 text-base leading-7 text-[#67615a]">
          Check the address, or return to AI_demo and begin again.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block bg-[#087f96] px-5 py-3 font-semibold text-white hover:bg-[#066b7e]"
        >
          Return home
        </Link>
      </section>
    </main>
  );
}
