"use client";
/*
 * Documentation:
 * Pie Chart — https://app.subframe.com/269cf10fcebb/library?component=Pie+Chart_0654ccc7-054c-4f3a-8e9a-b7c81dd3963c
 */

import React from "react";
import * as SubframeUtils from "../utils";
import * as SubframeCore from "@subframe/core";

interface PieChartRootProps
  extends React.ComponentProps<typeof SubframeCore.PieChart> {
  className?: string;
}

const PieChartRoot = React.forwardRef<
  React.ElementRef<typeof SubframeCore.PieChart>,
  PieChartRootProps
>(function PieChartRoot({ className, ...otherProps }: PieChartRootProps, ref) {
  return (
    <SubframeCore.PieChart
      className={SubframeUtils.twClassNames("h-52 w-52", className)}
      ref={ref}
      colors={[
        "#ec4899",
        "#fbcfe8",
        "#db2777",
        "#f9a8d4",
        "#be185d",
        "#f472b6",
      ]}
      {...otherProps}
    />
  );
});

export const PieChart = PieChartRoot;
