type Tab = {
    label: string;
    value: string;
};

type TabGroupProps = {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (value: string) => void;
    accentColor?: "green" | "amber" | "blue";
};

const accentColors = {
    green: "#16a34a",
    amber: "#d97706",
    blue: "#2563eb",
};

export default function TabGroup({
    tabs,
    activeTab,
    onTabChange,
    accentColor = "green",
}: TabGroupProps) {
    const accent = accentColors[accentColor];
    return (
        <div
            className="flex border-b"
            style={{ borderColor: "var(--border-soft)" }}
        >
            {tabs.map((tab) => {
                const isActive = activeTab === tab.value;
                return (
                    <button
                        key={tab.value}
                        onClick={() => onTabChange(tab.value)}
                        className="px-5 py-3 text-xs font-semibold tracking-[0.12em] uppercase transition-all duration-300"
                        style={{
                            borderBottom: isActive ? `2px solid ${accent}` : "2px solid transparent",
                            color: isActive ? accent : "var(--text-muted)",
                            marginBottom: "-1px",
                        }}
                    >
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}
