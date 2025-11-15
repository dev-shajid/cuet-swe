export interface CT {
    id: string;
    name: string;
    maxMarks: number;
    conductedDate?: string;
    isPublished: boolean;
    marks: Record<string, number>;
}

export interface CTConfig {
    bestCTsToCount: number;
}