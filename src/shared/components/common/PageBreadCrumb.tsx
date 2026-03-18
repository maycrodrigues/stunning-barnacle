import { Link } from "react-router";

type BreadcrumbItem = {
  label: string;
  to?: string;
};

interface BreadcrumbProps {
  pageTitle: string;
  items?: BreadcrumbItem[];
}

const Separator: React.FC = () => {
  return (
    <svg
      className="stroke-current shrink-0"
      width="17"
      height="16"
      viewBox="0 0 17 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
        stroke=""
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const PageBreadcrumb: React.FC<BreadcrumbProps> = ({ pageTitle, items }) => {
  const resolvedItems: BreadcrumbItem[] =
    items && items.length > 0
      ? items
      : [
          { label: "Home", to: "/" },
          { label: pageTitle },
        ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <h2
        className="text-xl font-semibold text-gray-800 dark:text-white/90"
        x-text="pageName"
      >
        {pageTitle}
      </h2>
      <nav>
        <ol className="flex flex-wrap items-center gap-1.5 max-w-full">
          {resolvedItems.map((item, index) => {
            const isLast = index === resolvedItems.length - 1;
            return (
              <li key={`${item.label}-${index}`} className="flex items-center gap-1.5 min-w-0">
                {item.to && !isLast ? (
                  <Link
                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 whitespace-nowrap"
                    to={item.to}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={`text-sm ${
                      isLast ? "text-gray-800 dark:text-white/90" : "text-gray-500 dark:text-gray-400"
                    } ${isLast ? "truncate max-w-[40vw] sm:max-w-[50vw] md:max-w-[60vw]" : "whitespace-nowrap"}`}
                    title={item.label}
                  >
                    {item.label}
                  </span>
                )}
                {!isLast ? <Separator /> : null}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
};

export default PageBreadcrumb;
