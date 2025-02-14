const buttons = [
    {
        text: `tomorrow`,
        ms: 0,
        styling: "basis-full",
        stylingButton: "h-8 bg-blue-900",
    },
    { text: "1 minute", ms: 60 * 1000, styling: "basis-[48.5%]", stylingButton: "h-5" },
    { text: "3 minutes", ms: 3 * 60 * 1000, styling: "basis-[48.5%]", stylingButton: "h-5" },
    { text: "10 minutes", ms: 10 * 60 * 1000, styling: "basis-[48.5%]", stylingButton: "h-6" },
    { text: "15 minutes", ms: 15 * 60 * 1000, styling: "basis-[48.5%]", stylingButton: "h-6" },
    { text: "30 minutes", ms: 30 * 60 * 1000, styling: "basis-[48.5%]", stylingButton: "h-7" },
    { text: "45 minutes", ms: 45 * 60 * 1000, styling: "basis-[48.5%]", stylingButton: "h-7" },
    { text: "1 hour", ms: 60 * 60 * 1000, styling: "basis-[48.5%]", stylingButton: "h-8" },
    { text: "90 minutes", ms: 90 * 60 * 1000, styling: "basis-[48.5%]", stylingButton: "h-8" },
    {
        text: "2 hrs",
        ms: 2 * 60 * 60 * 1000,
        styling: "basis-[22.75%]",
        stylingButton: "h-8",
    },
    { text: "3 hrs", ms: 3 * 60 * 60 * 1000, styling: "basis-[22.75%]", stylingButton: "h-8" },
    { text: "4 hrs", ms: 4 * 60 * 60 * 1000, styling: "basis-[22.75%]", stylingButton: "h-8" },
    { text: "6 hrs", ms: 6 * 60 * 60 * 1000, styling: "basis-[22.75%]", stylingButton: "h-8" },
    { text: "8 hrs", ms: 8 * 60 * 60 * 1000, styling: "basis-[22.75%]", stylingButton: "h-8" },
    { text: "12 hrs", ms: 12 * 60 * 60 * 1000, styling: "basis-[22.75%]", stylingButton: "h-8" },
    { text: "18 hrs", ms: 18 * 60 * 60 * 1000, styling: "basis-[22.75%]", stylingButton: "h-8" },
    { text: "24 hrs", ms: 24 * 60 * 60 * 1000, styling: "basis-[22.75%]", stylingButton: "h-8" },
];

const now = new Date();
let hours = 0;
let previousFutureTime;

buttons.forEach((button, index) => {
    const futureTime = new Date(now.getTime() + button.ms);

    const nextMorning = new Date(now);
    nextMorning.setDate(now.getDate() + 1);
    nextMorning.setHours(6, 0, 0, 0);

    if (futureTime.getDate() !== now.getDate()) {
        if (index > 0 && previousFutureTime) {
            futureTime.setTime(previousFutureTime.getTime() + hours * 60 * 60 * 1000);
            hours++;
        }
        if (futureTime < nextMorning) {
            if (hours === 0) {
                hours = Math.ceil((nextMorning - futureTime) / (1000 * 60 * 60));
                futureTime.setHours(futureTime.getHours() + hours);
                previousFutureTime = futureTime;
                hours = 1;
            }
        }

        const hoursInFuture = Math.floor((futureTime - now) / (1000 * 60 * 60));

        button.stylingButton += " bg-blue-900";
        button.ms = futureTime.getTime() - now.getTime();
        button.text = `${hoursInFuture} hrs`;
    } else if (button.text !== "tomorrow") {
        button.stylingButton += " bg-neutral";
    }
});

export default buttons;
