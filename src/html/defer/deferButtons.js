import { buttonConfig } from "./deferButtonsTime.ts";

const createButtons = () => {
    const buttons = [];

    buttons.push(buttonConfig.tomorrow);

    buttonConfig.minutes.forEach(({ value, height }) => {
        buttons.push({
            text: `${value} minute${value > 1 ? "s" : ""}`,
            ms: value * 60 * 1000,
            styling: "basis-[48.5%]",
            stylingButton: height,
        });
    });

    buttonConfig.hours.forEach(({ value, text, height, styling }) => {
        const displayText = text || `${value} hrs`;
        const buttonStyling = styling || "basis-[22.75%]";

        buttons.push({
            text: displayText,
            ms: value * 60 * 60 * 1000,
            styling: buttonStyling,
            stylingButton: height,
        });
    });

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
