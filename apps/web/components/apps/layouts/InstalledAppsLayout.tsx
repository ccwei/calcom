import type { ComponentProps } from "react";
import React from "react";

import AppCategoryNavigation from "@calcom/app-store/_components/AppCategoryNavigation";
import { AppCategories } from "@calcom/prisma/enums";

import Shell from "~/shell/Shell";

const INSTALLED_APP_CATEGORIES = [AppCategories.calendar, AppCategories.conferencing];

export default function InstalledAppsLayout({
  children,
  ...rest
}: { children: React.ReactNode } & ComponentProps<typeof Shell>) {
  return (
    <Shell {...rest} title="Installed Apps" description="Manage your installed apps or change settings">
      <AppCategoryNavigation
        baseURL="/apps/installed"
        containerClassname="min-w-0 w-full"
        allowedCategories={INSTALLED_APP_CATEGORIES}>
        {children}
      </AppCategoryNavigation>
    </Shell>
  );
}
export const getLayout = (page: React.ReactElement) => <InstalledAppsLayout>{page}</InstalledAppsLayout>;
