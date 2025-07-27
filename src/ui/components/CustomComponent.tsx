"use client";
/*
 * Documentation:
 * Custom Component — https://app.subframe.com/269cf10fcebb/library?component=Custom+Component_30743aba-822e-49f0-866f-95f5037377b4
 */

import React from "react";
import * as SubframeUtils from "../utils";

interface CustomComponentRootProps
  extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const CustomComponentRoot = React.forwardRef<
  HTMLDivElement,
  CustomComponentRootProps
>(function CustomComponentRoot(
  { className, ...otherProps }: CustomComponentRootProps,
  ref
) {
  return (
    <div
      className={SubframeUtils.twClassNames(
        "flex flex-col items-start gap-2",
        className
      )}
      ref={ref}
      {...otherProps}
    />
  );
});

export const CustomComponent = CustomComponentRoot;
