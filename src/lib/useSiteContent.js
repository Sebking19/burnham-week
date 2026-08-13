import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

// Loads one cached block of burnhamweek.com content (news, fleets, documents, courses, sponsors, social)
export default function useSiteContent(key) {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    base44.entities.SiteContent.filter({ key })
      .then(rows => {
        if (!active) return;
        setRecord(rows[0] || null);
        setLoading(false);
      })
      .catch(() => active && setLoading(false));
    return () => { active = false; };
  }, [key]);

  return { record, items: record?.items || [], loading };
}