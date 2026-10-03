import React from "react";
import { useSearch } from "../../context/SearchContext";

interface HighlightTextProps {
  text: string;
}

const HighlightText: React.FC<HighlightTextProps> = ({ text }) => {
  const { searchQuery } = useSearch();

  if (!searchQuery.trim()) return <>{text}</>;

  if (!searchQuery.trim()) return <>{text}</>;

  const lowerQuery = searchQuery.toLowerCase();

  const parts: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    const idx = remaining.toLowerCase().indexOf(lowerQuery);
    if (idx === -1) {
      parts.push(remaining);
      break;
    }
    parts.push(remaining.slice(0, idx));
    const match = remaining.slice(idx, idx + searchQuery.length);
    parts.push(`__MATCH__${match}__MATCH__`);
    remaining = remaining.slice(idx + searchQuery.length);
  }

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("__MATCH__")) {
          const clean = part.replace("__MATCH__", "").replace("__MATCH__", "");
          return (
            <mark
              key={index}
              className="px-0.5 py-0.5 rounded bg-yellow-300 text-black dark:bg-yellow-500 dark:text-black"
            >
              {clean}
            </mark>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </>
  );
};

export default HighlightText;
