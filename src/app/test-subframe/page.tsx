"use client";

import React from "react";
import { Badge } from "@/ui/components/Badge";
import { IconButton } from "@/ui/components/IconButton";
import { FeatherPlus } from "@subframe/core";

export default function TestSubframe() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Subframe Test</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">Badge Test:</h2>
          <Badge variant="neutral">Test Badge</Badge>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-2">IconButton Test:</h2>
          <IconButton size="medium" icon={<FeatherPlus />} />
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-2">Tailwind Classes Test:</h2>
          <div className="text-caption font-caption text-subtext-color">
            This should use Subframe typography
          </div>
          <div className="text-body font-body text-default-font">
            This should use Subframe body text
          </div>
          <div className="text-heading-2 font-heading-2 text-default-font">
            This should use Subframe heading
          </div>
        </div>
      </div>
    </div>
  );
} 