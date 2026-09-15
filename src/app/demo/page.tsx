import type { Metadata } from "next";
import { AssignmentDemo } from "./assignment-demo";

export const metadata: Metadata = {
  title: "Assignment demo · AI_thena",
  description:
    "A no-login colleague preview of bounded AI-supported learning and formative assessment.",
};

export default function DemoPage() {
  return <AssignmentDemo />;
}
