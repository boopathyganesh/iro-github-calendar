import React from "react";
import GitHubCalendar from "../src/GitHubCalendar";

const App: React.FC = () => {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">GitHub Contributions Calendar</h1>
      <GitHubCalendar username="torvalds" startYear={2023} />
    </div>
  );
};

export default App;
