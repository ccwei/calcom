import process from "node:process";
import { useIsEmbed } from "@calcom/embed-core/embed-iframe";
import { APP_NAME, POWERED_BY_URL } from "@calcom/lib/constants";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import Link from "next/link";

const PoweredByCal = ({
  logoOnly,
  hasValidLicense,
}: {
  logoOnly?: boolean;
  hasValidLicense?: boolean | null;
}) => {
  const { t } = useLocale();
  const isEmbed = useIsEmbed();

  return (
    <div
      className={`p-2 text-center text-xs sm:text-right${
        isEmbed ? " max-w-3xl" : ""
      }`}
    >
      <span className="text-emphasis font-semibold">DadaCal</span>
    </div>
  );
};

export default PoweredByCal;
