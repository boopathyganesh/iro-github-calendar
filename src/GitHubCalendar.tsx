import React, { useEffect, useState } from "react";
import axios from "axios";
//import { format, getMonth } from "date-fns";
import styles from "./calenderStyles.module.css";
import clsx from "clsx";

interface ContributionDay {
  date: string;
  contributions: number;
}

interface WeekData {
  week: number;
  days: ContributionDay[];
}

interface GitHubCalendarProps {
  username: string;
  startYear?: number;
  theme?: string;
  classNames?: {
    calenderContainer: string,
    monthLabels: string,
    dayLabels: string,
    gridClass: string,
  }
}

function generateColorShades(userColor: string, steps: number = 3): string[] {
  const baseColor = "#ebedf0"; // Lightest base color
  const shades = [baseColor];

  for (let i = steps; i >= 1; i--) {
    const adjustedColor = lightenColor(userColor, i * 15);
    shades.push(adjustedColor);
  }

  shades.push(userColor);
  return shades;
}

function lightenColor(hex: string, percent: number): string {
  const hexToHSL = (hex: string) => {
    const [r, g, b] = hex.match(/\w\w/g)!.map((x) => parseInt(x, 16) / 255);
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    let h = 0,
      s = 0,
      l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      h =
        max === r
          ? (g - b) / d + (g < b ? 6 : 0)
          : max === g
            ? (b - r) / d + 2
            : (r - g) / d + 4;
      h /= 6;
    }
    return [h * 360, s, l];
  };

  const hslToHex = (h: number, s: number, l: number) => {
    const hueToRGB = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hueToRGB(p, q, h / 360 + 1 / 3);
      g = hueToRGB(p, q, h / 360);
      b = hueToRGB(p, q, h / 360 - 1 / 3);
    }

    return `#${[r, g, b]
      .map((x) => Math.round(x * 255).toString(16).padStart(2, "0"))
      .join("")}`;
  };

  let [h, s, l] = hexToHSL(hex);
  l = Math.min(0.9, l + percent / 100);
  return hslToHex(h, s, l);
}


const GitHubCalendar: React.FC<GitHubCalendarProps> = ({
  username,
  startYear,
  theme = "#216e39",
  classNames
}) => {
  const [contributions, setContributions] = useState<WeekData[]>([]);
  const [totalContribution, setTotalContribution] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const apiBaseUrl = "https://iro-github.vercel.app/github/calendar"

  const colors = generateColorShades(theme);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(apiBaseUrl, {
          params: { username, start_year: startYear },
        });
        setTotalContribution(response.data.total_contribution)
        setContributions(response.data.contribution_calendar);
      } catch (error: any) {
        setError(error.message);
        console.error("Error fetching contributions", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [username, startYear, apiBaseUrl]);

  // Determine max contribution value
  const maxContributions = contributions
    .flatMap((week) => week.days)
    .reduce((max, day) => Math.max(max, day.contributions), 0);

  // Function to get color based on contribution count
  const getColor = (count: number) => {
    if (count === 0) return colors[0];
    if (count < maxContributions * 0.25) return colors[1];
    if (count < maxContributions * 0.5) return colors[2];
    if (count < maxContributions * 0.75) return colors[3];
    return colors[4];
  };

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  // Track months that have been displayed
  const displayedMonths = new Set<number>();

  if (loading) return <div className={styles.loader}>Fetching Data from GitHub...</div>;
  if (error) return <div className={styles.loader}>{error}</div>;
  return (
    <div className={clsx(styles.githubCalendarContainer, classNames?.calenderContainer)}>
      {/* Month Labels */}
      <div className={clsx(styles.githubCalendarMonthLabels, classNames?.monthLabels)}>
        <div style={{ width: '1.25rem' }}></div>
        {contributions.map((week, weekIdx) => {
          const firstDayOfWeek = new Date(week.days[0]?.date);
          const month = firstDayOfWeek.getMonth();


          if (!displayedMonths.has(month)) {
            displayedMonths.add(month);
            return (
              <div key={weekIdx}>
                {monthNames[month]}
              </div>
            );
          } else {
            return <div key={weekIdx}></div>;
          }
        })}
      </div>

      <div className={clsx(styles.githubCalendarGrid, classNames?.dayLabels)}>
        <div className={styles.githubCalendarDays}>
          {daysOfWeek.map((day, dayIdx) => (
            <div key={dayIdx} className={styles.githubCalendarDay}>
              {dayIdx % 2 !== 0 ? <div>{day}</div> : <div></div>}
            </div>
          ))}
        </div>
        <div className={styles.githubCalendarTotal}>
          Total Contributions : {totalContribution}
        </div>
        <div className={clsx(styles.githubCalendarLegendContainer, classNames?.gridClass)}>
          <span>less</span>
          <div className={styles.githubCalendarColumn}>
            {colors.map((color, dayIdx) => (
              <div
                key={dayIdx}
                className={styles.githubCalendarLegendBox}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <span>more</span>
        </div>
        {contributions.map((week, weekIdx) => (
          <div key={weekIdx} className={styles.githubCalendarDays}>
            {Array.from({ length: 7 }).map((_, dayIdx) => {
              const day =
                week.days.find((d) => new Date(d.date).getDay() === dayIdx) ||
                { date: "N/A", contributions: 0 };

              const currentDate = new Date();
              const formattedDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;


              return (
                <div
                  key={dayIdx}
                  title={`${day.date}: ${day.contributions} contributions`}
                  className={clsx(styles.githubCalendarBox, ` ${day.date === formattedDate ? styles.today : ""}`, classNames?.gridClass)}
                  style={{ backgroundColor: day.date === "N/A" ? "transparent" : getColor(day.contributions) }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GitHubCalendar;
