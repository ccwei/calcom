import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useMemo } from "react";

import type { AppCategories } from "@calcom/prisma/enums";
import cs from "@calcom/ui/classNames";
import { HorizontalTabs, VerticalTabs } from "@calcom/ui/components/navigation";

import getAppCategories from "../_utils/getAppCategories";

const AppCategoryNavigation = ({
  baseURL,
  children,
  containerClassname,
  className,
  classNames,
  useQueryParam = false,
  allowedCategories,
}: {
  baseURL: string;
  children: React.ReactNode;
  /** @deprecated use classNames instead */
  containerClassname?: string;
  /** @deprecated use classNames instead */
  className?: string;
  classNames?: {
    root?: string;
    container?: string;
    verticalTabsItem?: string;
  };
  useQueryParam?: boolean;
  allowedCategories?: AppCategories[];
}) => {
  const [animationRef] = useAutoAnimate<HTMLDivElement>();
  const appCategories = useMemo(
    () => getAppCategories(baseURL, useQueryParam, allowedCategories),
    [baseURL, useQueryParam, allowedCategories]
  );

  return (
    <div
      className={cs(
        "flex flex-col xl:flex-row xl:space-x-6",
        classNames?.root ?? className
      )}
    >
      <div className="hidden xl:block">
        <VerticalTabs
          tabs={appCategories}
          sticky
          linkShallow
          itemClassname={classNames?.verticalTabsItem}
        />
      </div>
      <div className="block xl:hidden">
        <HorizontalTabs
          tabs={appCategories}
          linkShallow
          scrollActiveTabIntoView
        />
      </div>
      <main
        className={classNames?.container ?? containerClassname}
        ref={animationRef}
      >
        {children}
      </main>
    </div>
  );
};

export default AppCategoryNavigation;
