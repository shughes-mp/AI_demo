import type { Metadata } from "next";
import { AssignmentDemo } from "./assignment-demo";

export const metadata: Metadata = {
  title: "AI-supported assignment demo",
  description:
    "A no-login colleague preview of bounded AI-supported learning and formative assessment.",
};

export default function DemoPage() {
  return <AssignmentDemo />;
}
