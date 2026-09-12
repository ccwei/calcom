import { useBottomNavItems } from "../useBottomNavItems";
import { UserPermissionRole } from "@calcom/prisma/enums";
import type { NavigationItemType } from "./NavigationItem";
import { useSession } from "next-auth/react";

export function useMobileMoreItems(): NavigationItemType[] {
  const { data: session } = useSession();
  const user = session?.user;
  const isAdmin = user?.role === UserPermissionRole.ADMIN;

  const bottomNavItems = useBottomNavItems({
    isAdmin,
    user,
  });

  const filteredBottomNavItems = bottomNavItems.filter(
    (item: NavigationItemType) => item.name !== "settings"
  );
  return filteredBottomNavItems;
}
