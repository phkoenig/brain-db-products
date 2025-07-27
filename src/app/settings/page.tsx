"use client";

import React from "react";
import { DefaultPageLayout } from "@/ui/layouts/DefaultPageLayout";
import { Table } from "@/ui/components/Table";
import { Badge } from "@/ui/components/Badge";
import { DropdownMenu } from "@/ui/components/DropdownMenu";
import { FeatherStar, FeatherPlus, FeatherEdit2, FeatherTrash, FeatherMoreHorizontal } from "@subframe/core";
import * as SubframeCore from "@subframe/core";
import { IconButton } from "@/ui/components/IconButton";
import { useMaterialCategories } from "@/hooks/useMaterialCategories";

function Settings() {
  const { categories, loading, error, deleteCategory } = useMaterialCategories();

  console.log("6. [UI] Rendering Settings page. State:", { loading, error, categories_count: categories.length });

  // Loading state
  if (loading) {
    return (
      <DefaultPageLayout>
        <div className="flex w-full flex-col items-start gap-4 px-12 py-12">
          <div className="flex flex-col items-start gap-4">
            <span className="whitespace-pre-wrap text-heading-2 font-heading-2 text-default-font">
              {"Kategorien\n"}
            </span>
            <div className="text-body font-body text-neutral-500">
              Lade Kategorien...
            </div>
          </div>
        </div>
      </DefaultPageLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DefaultPageLayout>
        <div className="flex w-full flex-col items-start gap-4 px-12 py-12">
          <div className="flex flex-col items-start gap-4">
            <span className="whitespace-pre-wrap text-heading-2 font-heading-2 text-default-font">
              {"Kategorien\n"}
            </span>
            <div className="text-body font-body text-error-500">
              Fehler beim Laden der Kategorien: {error}
            </div>
          </div>
        </div>
      </DefaultPageLayout>
    );
  }

  // Handle delete category
  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory(id);
      console.log(`Kategorie ${id} erfolgreich gelöscht`);
    } catch (err) {
      console.error('Fehler beim Löschen der Kategorie:', err);
    }
  };

  return (
    <DefaultPageLayout>
      <div className="flex w-full flex-col items-start gap-4 px-12 py-12">
        <div className="flex flex-col items-start gap-4">
          <span className="whitespace-pre-wrap text-heading-2 font-heading-2 text-default-font">
            {"Kategorien\n"}
          </span>
          <Table
            className="h-auto w-auto flex-none"
            header={
              <Table.HeaderRow>
                <Table.HeaderCell>ID</Table.HeaderCell>
                <Table.HeaderCell>Main</Table.HeaderCell>
                <Table.HeaderCell>Sub</Table.HeaderCell>
                <Table.HeaderCell></Table.HeaderCell>
              </Table.HeaderRow>
            }
          >
            {categories.map((category) => (
              <Table.Row key={category.id}>
                <Table.Cell>
                  <span className="whitespace-nowrap text-body font-body text-neutral-500">
                    {category.id}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <Badge variant="neutral">{category.main_category}</Badge>
                </Table.Cell>
                <Table.Cell>
                  <span className="whitespace-nowrap text-body font-body text-neutral-500">
                    {category.sub_category}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex grow shrink-0 basis-0 items-center justify-end">
                    <SubframeCore.DropdownMenu.Root>
                      <SubframeCore.DropdownMenu.Trigger asChild={true}>
                        <IconButton
                          size="medium"
                          icon={<FeatherMoreHorizontal />}
                          onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                        />
                      </SubframeCore.DropdownMenu.Trigger>
                      <SubframeCore.DropdownMenu.Portal>
                        <SubframeCore.DropdownMenu.Content
                          side="bottom"
                          align="end"
                          sideOffset={8}
                          asChild={true}
                        >
                          <DropdownMenu>
                            <DropdownMenu.DropdownItem icon={<FeatherStar />}>
                              Favorite
                            </DropdownMenu.DropdownItem>
                            <DropdownMenu.DropdownItem icon={<FeatherPlus />}>
                              Add
                            </DropdownMenu.DropdownItem>
                            <DropdownMenu.DropdownItem icon={<FeatherEdit2 />}>
                              Edit
                            </DropdownMenu.DropdownItem>
                            <DropdownMenu.DropdownItem 
                              icon={<FeatherTrash />}
                              onClick={() => handleDeleteCategory(category.id)}
                            >
                              Delete
                            </DropdownMenu.DropdownItem>
                          </DropdownMenu>
                        </SubframeCore.DropdownMenu.Content>
                      </SubframeCore.DropdownMenu.Portal>
                    </SubframeCore.DropdownMenu.Root>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table>
        </div>
      </div>
    </DefaultPageLayout>
  );
}

export default Settings; 