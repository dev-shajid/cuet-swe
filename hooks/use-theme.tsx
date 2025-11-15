import reactNativeAsyncStorage from "@/utils/reactNativeAsyncStorage";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Appearance } from "react-native";

export interface ColorScheme {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    destructive: string;
    destructiveForeground: string;
    border: string;
    input: string;
    ring: string;
    chart1: string;
    chart2: string;
    chart3: string;
    chart4: string;
    chart5: string;
    sidebar: string;
    sidebarForeground: string;
    sidebarPrimary: string;
    sidebarPrimaryForeground: string;
    sidebarAccent: string;
    sidebarAccentForeground: string;
    sidebarBorder: string;
    sidebarRing: string;
    fontSans: string;
    fontSerif: string;
    fontMono: string;
    radius: string;
    shadow2xs: string;
    shadowXs: string;
    shadowSm: string;
    shadow: string;
    shadowMd: string;
    shadowLg: string;
    shadowXl: string;
    shadow2xl: string;
    trackingNormal: string;
    spacing: string;
    tabBackground: string;
    tabInactiveColor: string;
    tabActiveColor: string;
    tabBorder: string;
}

// 🩵 Light mode (:root)
const lightColors: ColorScheme = {
    background: "#f6f6ff",
    foreground: "#171717",
    card: "#ffffff",
    cardForeground: "#171717",
    popover: "#fcfcfc",
    popoverForeground: "#525252",
    primary: "#5850f1",
    primaryForeground: "#1e2723",
    secondary: "#fdfdfd",
    secondaryForeground: "#171717",
    muted: "#ededed",
    mutedForeground: "#202020",
    accent: "#ededed",
    accentForeground: "#202020",
    destructive: "#ca3214",
    destructiveForeground: "#fffcfc",
    border: "#dfdfdf",
    input: "#f6f6f6",
    ring: "#4138e9",
    chart1: "#72e3ad",
    chart2: "#3b82f6",
    chart3: "#8b5cf6",
    chart4: "#f59e0b",
    chart5: "#10b981",
    sidebar: "#fcfcfc",
    sidebarForeground: "#707070",
    sidebarPrimary: "#72e3ad",
    sidebarPrimaryForeground: "#1e2723",
    sidebarAccent: "#ededed",
    sidebarAccentForeground: "#202020",
    sidebarBorder: "#dfdfdf",
    sidebarRing: "#72e3ad",
    fontSans: "Outfit, sans-serif",
    fontSerif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
    fontMono: "monospace",
    radius: "0.5rem",
    shadow2xs: "0px 1px 3px 0px hsl(0 0% 0% / 0.09)",
    shadowXs: "0px 1px 3px 0px hsl(0 0% 0% / 0.09)",
    shadowSm:
        "0px 1px 3px 0px hsl(0 0% 0% / 0.17), 0px 1px 2px -1px hsl(0 0% 0% / 0.17)",
    shadow:
        "0px 1px 3px 0px hsl(0 0% 0% / 0.17), 0px 1px 2px -1px hsl(0 0% 0% / 0.17)",
    shadowMd:
        "0px 1px 3px 0px hsl(0 0% 0% / 0.17), 0px 2px 4px -1px hsl(0 0% 0% / 0.17)",
    shadowLg:
        "0px 1px 3px 0px hsl(0 0% 0% / 0.17), 0px 4px 6px -1px hsl(0 0% 0% / 0.17)",
    shadowXl:
        "0px 1px 3px 0px hsl(0 0% 0% / 0.17), 0px 8px 10px -1px hsl(0 0% 0% / 0.17)",
    shadow2xl: "0px 1px 3px 0px hsl(0 0% 0% / 0.43)",
    trackingNormal: "0.025em",
    spacing: "0.25rem",
    tabBackground: "#fafcff",
    tabInactiveColor: "#525252",
    tabActiveColor: "#020202ff",
    tabBorder: "#e0e7ff",
};

// 🖤 Dark mode (.dark)
const darkColors: ColorScheme = {
    background: "#141414",
    foreground: "#e7e9ea",
    card: "#000000",
    cardForeground: "#d9d9d9",
    popover: "#000000",
    popoverForeground: "#e7e9ea",
    primary: "#5850f1",
    primaryForeground: "#ffffffff",
    secondary: "#f0f3f4",
    secondaryForeground: "#0f1419",
    muted: "#181818",
    mutedForeground: "#72767a",
    accent: "#061622",
    accentForeground: "#1c9cf0",
    destructive: "#f4212e",
    destructiveForeground: "#ffffff",
    border: "#242628",
    input: "#22303c",
    ring: "#1da1f2",
    chart1: "#4ade80",
    chart2: "#60a5fa",
    chart3: "#a78bfa",
    chart4: "#fbbf24",
    chart5: "#2dd4bf",
    sidebar: "#121212",
    sidebarForeground: "#898989",
    sidebarPrimary: "#006239",
    sidebarPrimaryForeground: "#dde8e3",
    sidebarAccent: "#313131",
    sidebarAccentForeground: "#fafafa",
    sidebarBorder: "#292929",
    sidebarRing: "#4ade80",
    fontSans: "Outfit, sans-serif",
    fontSerif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
    fontMono: "monospace",
    radius: "0.5rem",
    shadow2xs: "0px 1px 3px 0px hsl(0 0% 0% / 0.09)",
    shadowXs: "0px 1px 3px 0px hsl(0 0% 0% / 0.09)",
    shadowSm:
        "0px 1px 3px 0px hsl(0 0% 0% / 0.17), 0px 1px 2px -1px hsl(0 0% 0% / 0.17)",
    shadow:
        "0px 1px 3px 0px hsl(0 0% 0% / 0.17), 0px 1px 2px -1px hsl(0 0% 0% / 0.17)",
    shadowMd:
        "0px 1px 3px 0px hsl(0 0% 0% / 0.17), 0px 2px 4px -1px hsl(0 0% 0% / 0.17)",
    shadowLg:
        "0px 1px 3px 0px hsl(0 0% 0% / 0.17), 0px 4px 6px -1px hsl(0 0% 0% / 0.17)",
    shadowXl:
        "0px 1px 3px 0px hsl(0 0% 0% / 0.17), 0px 8px 10px -1px hsl(0 0% 0% / 0.17)",
    shadow2xl: "0px 1px 3px 0px hsl(0 0% 0% / 0.43)",
    trackingNormal: "0.025em",
    spacing: "0.25rem",
    tabBackground: "#020306",
    tabInactiveColor: "#a9a9a9",
    tabActiveColor: "#ffffff",
    tabBorder: "#1e293bff"
};

interface ThemeContextType {
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    colors: ColorScheme;
}

const ThemeContext = createContext<undefined | ThemeContextType>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        setTheme();
    }, []);

    const setTheme = async () => {
        const getSavedTheme = await reactNativeAsyncStorage.getItem("theme");
        if (getSavedTheme === null) {
            const theme = Appearance.getColorScheme();
            setIsDarkMode(theme === "dark");
            await reactNativeAsyncStorage.setItem("theme", theme ?? "light");
        } else {
            setIsDarkMode(getSavedTheme === "dark");
            Appearance.setColorScheme(getSavedTheme === "dark" ? "dark" : "light");
        }
    }

    const toggleDarkMode = async () => {
        const theme = Appearance.getColorScheme()
        console.log({ theme })
        setIsDarkMode(theme == 'dark' ? false : true);
        Appearance.setColorScheme(theme == 'dark' ? 'light' : 'dark');
        await reactNativeAsyncStorage.setItem("theme", theme == 'dark' ? 'light' : 'dark');
    };

    const colors = isDarkMode ? darkColors : lightColors;

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, colors }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error("useTheme must be used within a ThemeProvider");
    return context;
};
