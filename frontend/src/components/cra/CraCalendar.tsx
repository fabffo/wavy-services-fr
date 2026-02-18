import { eachDayOfInterval, endOfMonth, format, getDay, isWeekend, startOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CraCalendarProps {
  month: string;
  dayDetails: Record<string, { state: "worked" | "absent"; comment: string }>;
  onDayChange: (date: string, state: "worked" | "absent") => void;
}

export function CraCalendar({ month, dayDetails, onDayChange }: CraCalendarProps) {
  const monthDate = new Date(month + "-01");
  const days = eachDayOfInterval({
    start: startOfMonth(monthDate),
    end: endOfMonth(monthDate),
  });

  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  
  // Get the day of week for the first day (0 = Sunday, adjust for Monday start)
  const firstDayOfWeek = getDay(startOfMonth(monthDate));
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const workingDays = days.filter(d => !isWeekend(d));
  const workedCount = Object.values(dayDetails).filter(d => d.state === "worked").length;
  const absentCount = Object.values(dayDetails).filter(d => d.state === "absent").length;

  return (
    <div className="space-y-4">
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span>Travaillé ({workedCount})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-500" />
          <span>Absent ({absentCount})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-muted" />
          <span>Week-end</span>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-7 bg-muted">
          {weekDays.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium border-b">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {/* Empty cells for offset */}
          {Array.from({ length: offset }).map((_, i) => (
            <div key={`empty-${i}`} className="p-2 border-b border-r bg-muted/30" />
          ))}

          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const isWeekendDay = isWeekend(day);
            const detail = dayDetails[dateStr];

            return (
              <div
                key={dateStr}
                className={cn(
                  "p-2 border-b border-r min-h-[60px] transition-colors",
                  isWeekendDay && "bg-muted/50",
                  !isWeekendDay && "cursor-pointer hover:bg-muted/30",
                  detail?.state === "worked" && "bg-green-100 hover:bg-green-200",
                  detail?.state === "absent" && "bg-orange-100 hover:bg-orange-200"
                )}
                onClick={() => {
                  if (!isWeekendDay) {
                    const newState = detail?.state === "worked" ? "absent" : "worked";
                    onDayChange(dateStr, newState);
                  }
                }}
              >
                <div className="flex flex-col h-full">
                  <span className={cn(
                    "text-sm font-medium",
                    isWeekendDay && "text-muted-foreground"
                  )}>
                    {format(day, "d")}
                  </span>
                  {!isWeekendDay && detail && (
                    <span className="text-xs mt-1 text-muted-foreground">
                      {detail.state === "worked" ? "T" : "A"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Cliquez sur un jour ouvré pour basculer entre Travaillé et Absent
      </p>
    </div>
  );
}