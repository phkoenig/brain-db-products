"use client";
/*
 * Documentation:
 * Default Page Layout — https://app.subframe.com/269cf10fcebb/library?component=Default+Page+Layout_a57b1c43-310a-493f-b807-8cc88e2452cf
 * Sidebar rail with labels — https://app.subframe.com/269cf10fcebb/library?component=Sidebar+rail+with+labels_3296372a-ba83-4ca9-b291-10dc2aa86fdd
 */

import React from "react";
import * as SubframeUtils from "../utils";
import { SidebarRailWithLabels } from "../components/SidebarRailWithLabels";
import { FeatherDatabase } from "@subframe/core";
import { FeatherPlus } from "@subframe/core";
import { FeatherSettings } from "@subframe/core";
import { FeatherUserCircle } from "@subframe/core";

interface DefaultPageLayoutRootProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

const DefaultPageLayoutRoot = React.forwardRef<
  HTMLDivElement,
  DefaultPageLayoutRootProps
>(function DefaultPageLayoutRoot(
  { children, className, ...otherProps }: DefaultPageLayoutRootProps,
  ref
) {
  return (
    <div
      className={SubframeUtils.twClassNames(
        "flex h-screen w-full items-center",
        className
      )}
      ref={ref}
      {...otherProps}
    >
      <SidebarRailWithLabels
        className="overflow-auto"
        header={
          <div className="flex flex-col items-center justify-center gap-2 px-1 py-1">
            <span className="text-title font-title text-default-font">M</span>
          </div>
        }
        footer={
          <>
            <SidebarRailWithLabels.NavItem icon={<FeatherSettings />}>
              Settings
            </SidebarRailWithLabels.NavItem>
            <SidebarRailWithLabels.NavItem icon={<FeatherUserCircle />}>
              User
            </SidebarRailWithLabels.NavItem>
          </>
        }
      >
        <SidebarRailWithLabels.NavItem
          icon={<FeatherDatabase />}
          selected={true}
        >
          DB
        </SidebarRailWithLabels.NavItem>
        <SidebarRailWithLabels.NavItem icon={<FeatherPlus />}>
          Neu
        </SidebarRailWithLabels.NavItem>
      </SidebarRailWithLabels>
      {children ? (
        <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4 self-stretch overflow-y-auto bg-default-background">
          {children}
        </div>
      ) : null}
    </div>
  );
});

export const DefaultPageLayout = DefaultPageLayoutRoot;
