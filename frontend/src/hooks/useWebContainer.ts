import { useEffect, useState, useRef } from "react";
import { WebContainer } from '@webcontainer/api';

export function useWebContainer() {
    const [webcontainer, setWebcontainer] = useState<WebContainer>();
    const isInitializedRef = useRef(false);

    useEffect(() => {
        async function main() {
            if (!isInitializedRef.current) {
                const webcontainerInstance = await WebContainer.boot();
                setWebcontainer(webcontainerInstance);
                isInitializedRef.current = true;
            }
        }

        main();
    }, []);

    return webcontainer;
}