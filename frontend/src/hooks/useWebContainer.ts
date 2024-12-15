import { useEffect, useState, useRef } from "react";
import { WebContainer } from '@webcontainer/api';

export function useWebContainer() {
    const [webcontainer, setWebcontainer] = useState<WebContainer>();
    const isInitializedRef = useRef(false);

    useEffect(() => {
        async function main() {
            // Only boot if not already initialized
            if (!isInitializedRef.current) {
                const webcontainerInstance = await WebContainer.boot();
                setWebcontainer(webcontainerInstance);
                isInitializedRef.current = true;
            }
        }

        main();
    }, []); // Empty dependency array ensures it runs only once

    return webcontainer;
}