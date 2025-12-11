import { ReactNode } from "react";

// Dashboard layout - authentication removed for open source version
export default async function LayoutPrivate({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
