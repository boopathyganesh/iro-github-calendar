import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
    build: {
        lib: {
            entry: "index.ts", // Your entry file
            name: "IroGithub",
            formats: ["es", "cjs"],
            fileName: (format) => `index.${format}.js`,
        },
        rollupOptions: {
            external: ["react", "react-dom", "axios", "clsx", "date-fns"], // Avoid bundling dependencies
        },
    },
    plugins: [
        dts({
            insertTypesEntry: true, // Ensure TypeScript types are generated
            outDir: "dist",
        }),
    ],
});
