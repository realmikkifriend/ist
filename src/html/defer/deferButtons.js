const createButtons = () => {
    const buttons = [
        {
            text: `tomorrow`,
            ms: 0,
            styling: "basis-full",
            stylingButton: "h-6 bg-blue-900",
        },
        { text: "1 minute", ms: 60 * 1000, styling: "basis-[48.5%]", stylingButton: "h-5" },
        { text: "3 minutes", ms: 3 * 60 * 1000, styling: "basis-[48.5%]", stylingButton: "h-5" },
        { text: "10 minutes", ms: 10 * 60 * 1000, styling: "basis-[48.5%]", stylingButton: "h-6" },
        { text: "15 minutes", ms: 15 * 60 * 1000, styling: "basis-[48.5%]", stylingButton: "h-6" },
        { text: "30 minutes", ms: 30 * 60 * 1000, styling: "basis-[48.5%]", stylingButton: "h-7" },
        { text: "45 minutes", ms: 45 * 60 * 1000, styling: "basis-[48.5%]", stylingButton: "h-7" },
        { text: "1 hour", ms: 60 * 60 * 1000, styling: "basis-[48.5%]", stylingButton: "h-7" },
        { text: "90 minutes", ms: 90 * 60 * 1000, styling: "basis-[48.5%]", stylingButton: "h-7" },
        { text: "2 hrs", ms: 2 * 60 * 60 * 1000, styling: "basis-[22.75%]", stylingButton: "h-7" },
        { text: "3 hrs", ms: 3 * 60 * 60 * 1000, styling: "basis-[22.75%]", stylingButton: "h-7" },
        { text: "4 hrs", ms: 4 * 60 * 60 * 1000, styling: "basis-[22.75%]", stylingButton: "h-7" },
        { text: "6 hrs", ms: 6 * 60 * 60 * 1000, styling: "basis-[22.75%]", stylingButton: "h-7" },
        { text: "8 hrs", ms: 8 * 60 * 60 * 1000, styling: "basis-[22.75%]", stylingButton: "h-7" },
        {
            text: "12 hrs",
            ms: 12 * 60 * 60 * 1000,
            styling: "basis-[22.75%]",
            stylingButton: "h-7",
        },
        {
            text: "18 hrs",
            ms: 18 * 60 * 60 * 1000,
            styling: "basis-[22.75%]",
            stylingButton: "h-7",
        },
        {
            text: "24 hrs",
            ms: 24 * 60 * 60 * 1000,
            styling: "basis-[22.75%]",
            stylingButton: "h-7",
        },
    ];

    const now = new Date();
    const nextMorning = new Date(now);
    nextMorning.setDate(now.getDate() + 1);
    nextMorning.setHours(6, 0, 0, 0);

    const processButton = (button, index, processedButtons) => {
        const futureTime = new Date(now.getTime() + button.ms);

        if (index > 2) {
            const roundingFactor = index >= 3 && index <= 7 ? 5 : 15;
            const roundedMinutes =
                Math.round(futureTime.getMinutes() / roundingFactor) * roundingFactor;
            futureTime.setMinutes(roundedMinutes);
        }

        if (futureTime.getDate() !== now.getDate()) {
            const previousProcessedButton = processedButtons[index - 1];
            const adjustedFutureTime = calculateAdjustedTime(
                futureTime,
                nextMorning,
                index,
                previousProcessedButton,
                processedButtons,
            );

            const hoursInFuture = Math.floor((adjustedFutureTime - now) / (1000 * 60 * 60));

            return {
                ...button,
                ms: adjustedFutureTime.getTime() - now.getTime(),
                text: `${hoursInFuture} hrs`,
                stylingButton: button.stylingButton + " bg-blue-900",
            };
        } else if (button.text !== "tomorrow") {
            return {
                ...button,
                ms: futureTime.getTime() - now.getTime(),
                stylingButton: button.stylingButton + " bg-neutral",
            };
        }

        return {
            ...button,
            ms: futureTime.getTime() - now.getTime(),
        };
    };

    const calculateAdjustedTime = (
        futureTime,
        nextMorning,
        index,
        previousButton,
        processedButtons,
    ) => {
        const adjustedTime = new Date(futureTime);

        const lastCrossedButton = processedButtons
            .slice(0, index)
            .reverse()
            .find((btn) => btn && new Date(now.getTime() + btn.ms).getDate() !== now.getDate());

        if (index > 0 && lastCrossedButton) {
            const hoursToAdd = processedButtons
                .slice(0, index)
                .filter(
                    (btn) => btn && new Date(now.getTime() + btn.ms).getDate() !== now.getDate(),
                ).length;

            const lastCrossedTime = new Date(now.getTime() + lastCrossedButton.ms);
            adjustedTime.setTime(lastCrossedTime.getTime() + hoursToAdd * 60 * 60 * 1000);
        }

        if (adjustedTime < nextMorning) {
            const hoursUntilMorning = Math.ceil((nextMorning - adjustedTime) / (1000 * 60 * 60));
            adjustedTime.setHours(adjustedTime.getHours() + hoursUntilMorning);
        }

        return adjustedTime;
    };

    return buttons.map((button, index, array) => {
        const processedButtons = array
            .slice(0, index)
            .map((btn, i) => (i < index ? processButton(btn, i, array.slice(0, i)) : null));
        return processButton(button, index, processedButtons);
    });
};

export default createButtons;
