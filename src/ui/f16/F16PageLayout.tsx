"use client";

import React from "react";
import { DefaultPageLayout } from "@/ui/layouts/DefaultPageLayout";
import F16Navigation from "@/components/f16/F16Navigation";

interface F16PageLayoutProps {
  children: React.ReactNode;
}

export function F16PageLayout({ children }: F16PageLayoutProps) {
  return (
    <div className="f16-portal">
      <F16Navigation />
      <DefaultPageLayout>
        {children}
      </DefaultPageLayout>
    </div>
  );
}
