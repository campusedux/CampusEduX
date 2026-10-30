// Browser fixture: real page JSX, with data/auth boundaries replaced by local mocks.
import React, { Children, cloneElement, isValidElement, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import Home from "@/app/page";
import Learning from "@/app/learning/page";
import Jobs from "@/app/jobs/page";
import Projects from "@/app/projects/page";
import Account from "@/app/account/page";
import AccountLayout from "@/app/account/layout";
import { Header } from "@/components/nav/Header";
import { BottomNav } from "@/components/nav/BottomNav";
import { AnnouncementBar } from "@/components/home/AnnouncementBar";
import { ListLoading } from "@/components/ui/Skeleton";
import JobsError from "@/app/jobs/error";
import ProjectsError from "@/app/projects/error";
import LearningError from "@/app/learning/error";

const query = new URLSearchParams(location.search);
const route = query.get("page") || "home";
const state = query.get("state") || "normal";

// Only async server components are expanded; client hooks use React's renderer.
async function resolveServer(node: React.ReactNode): Promise<React.ReactNode> {
  if (Array.isArray(node)) return Promise.all(Children.toArray(node).map(resolveServer));
  if (!isValidElement<{children?: React.ReactNode}>(node)) return node;
  if (typeof node.type === "function" && node.type.constructor.name === "AsyncFunction") {
    return resolveServer(await (node.type as (p: unknown) => Promise<React.ReactNode>)(node.props));
  }
  return cloneElement(node, {}, await resolveServer(node.props.children));
}

function App() {
  const [content, setContent] = useState<React.ReactNode>(null);
  useEffect(() => {
    const pages = {home: Home, learning: Learning, jobs: Jobs, projects: Projects, account: Account};
    async function render() {
      if (state === "loading") return <ListLoading title={route} variant={route === "jobs" ? "job" : route === "projects" ? "project" : "course"} />;
      if (state === "error") {
        const ErrorView = route === "jobs" ? JobsError : route === "projects" ? ProjectsError : LearningError;
        return <ErrorView error={new Error("Private fixture diagnostics")} reset={() => { document.documentElement.dataset.retried = "true"; }} />;
      }
      const Page = pages[route as keyof typeof pages];
      const page = await Page({searchParams: {}});
      return resolveServer(route === "account" ? await AccountLayout({children: page}) : page);
    }
    render().then(setContent).catch(error => {
      document.documentElement.dataset.redirect = error.message;
      setContent(<p className="page-shell">Sign in to continue</p>);
    });
  }, []);
  useEffect(() => { if (content) document.documentElement.dataset.ready = "true"; }, [content]);
  return <><Header /><AnnouncementBar /><main id="main-content" className="mobile-scroll-content min-h-[60vh]">{content}</main><BottomNav /></>;
}

createRoot(document.getElementById("root")!).render(<App />);
