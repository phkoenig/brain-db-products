"use client";
/*
 * Documentation:
 * Default Page Layout — https://app.subframe.com/library?component=Default+Page+Layout_a57b1c43-310a-493f-b807-8cc88e2452cf
 * Sidebar rail with labels — https://app.subframe.com/library?component=Sidebar+rail+with+labels_3296372a-ba83-4ca9-b291-10dc2aa86fdd
 */

import React from "react";
import * as SubframeUtils from "../utils";
import { SidebarRailWithLabels } from "../components/SidebarRailWithLabels";
import { FeatherCalendarDays } from "@subframe/core";
import { FeatherBox } from "@subframe/core";
import { FeatherMap } from "@subframe/core";
import { FeatherArmchair } from "@subframe/core";
import { FeatherDoorClosed } from "@subframe/core";
import { FeatherCamera } from "@subframe/core";
import { FeatherUsers } from "@subframe/core";
import { FeatherStamp } from "@subframe/core";
import { FeatherSettings } from "@subframe/core";

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
        header={
          <div className="flex flex-col items-center justify-center gap-2 px-1 py-1">
            <span className="text-heading-1 font-heading-1 text-default-font">
              F16
            </span>
          </div>
        }
        footer={<SidebarRailWithLabels.NavItem icon={<FeatherSettings />} />}
      >
        <div className="flex w-full grow shrink-0 basis-0 flex-col items-start justify-center">
          <SidebarRailWithLabels.NavItem
            icon={<FeatherCalendarDays />}
            selected={true}
          >
            Logbuch
          </SidebarRailWithLabels.NavItem>
          <SidebarRailWithLabels.NavItem icon={<FeatherBox />}>
            3D
          </SidebarRailWithLabels.NavItem>
          <SidebarRailWithLabels.NavItem icon={<FeatherMap />}>
            Pläne
          </SidebarRailWithLabels.NavItem>
          <SidebarRailWithLabels.NavItem icon={<FeatherArmchair />}>
            Muster
          </SidebarRailWithLabels.NavItem>
          <SidebarRailWithLabels.NavItem icon={<FeatherDoorClosed />}>
            Raum
          </SidebarRailWithLabels.NavItem>
          <SidebarRailWithLabels.NavItem icon={<FeatherCamera />}>
            Foto
          </SidebarRailWithLabels.NavItem>
          <SidebarRailWithLabels.NavItem icon={<FeatherUsers />}>
            Team
          </SidebarRailWithLabels.NavItem>
          <SidebarRailWithLabels.NavItem icon={<FeatherStamp />}>
            Doks
          </SidebarRailWithLabels.NavItem>
        </div>
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
