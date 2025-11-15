import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

interface ITabItem {
    name: string;
    label: string;
    icon_focused: keyof typeof Ionicons.glyphMap
    icon_unfocused: keyof typeof Ionicons.glyphMap
}

export default function StudentTabNavigator() {
    const { colors } = useTheme();

    const tab_items: ITabItem[] = [
        {
            name: 'home',
            label: 'Home',
            icon_focused: 'home',
            icon_unfocused: 'home-outline',
        },
        {
            name: 'courses',
            label: 'Courses',
            icon_focused: 'book',
            icon_unfocused: 'book-outline',
        },
        {
            name: 'profile',
            label: 'Profile',
            icon_focused: 'person',
            icon_unfocused: 'person-outline',
        },
    ];

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.tabActiveColor,
                tabBarInactiveTintColor: colors.tabInactiveColor,
                tabBarStyle: {
                    backgroundColor: colors.tabBackground,
                    borderTopWidth: 1,
                    borderTopColor: colors.tabBorder,
                    height: Platform.OS === 'ios' ? 88 : 70,
                    padding: 8,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                tabBarLabelStyle: {
                    fontWeight: '600',
                },
                tabBarIconStyle: {
                    marginTop: 4,
                },
                sceneStyle: { backgroundColor: colors.background },
                animation: 'shift',
            }}
        >
            {
                tab_items.map((item) => (
                    <Tabs.Screen
                        key={item.name}
                        name={item.name}
                        options={{
                            tabBarLabel: item.label,
                            tabBarIcon: ({ color, size, focused }) => (
                                <Ionicons
                                    name={focused ? item.icon_focused : item.icon_unfocused}
                                    size={size}
                                    color={color}
                                />
                            ),
                        }}
                    />
                ))
            }
        </Tabs>
    );
}