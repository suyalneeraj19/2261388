export async function Log(
    stack : "frontend" | "backend",
    level : "info" | "error" | "warn" | "debug" | "fatal",
    pkg : "api" | "component" | "hook" | "page" | "state" | "style" | "cache" | "controller" | "cron_job" | "db" | "repository" | "route" | "service", 
    message : string,
) {
    try {
        await fetch("http://20.244.56.144/evaluation-service/logs", {
            method : "POST",
            headers : {
                "Content-Type" : "application/json",
            },
            body : JSON.stringify({
                stack,
                level,
                package : pkg,message
            }),
        });
    } catch (error) {
        // Silently handle logging errors to prevent app crashes
        console.warn("Logging service unavailable:", error);
    }
}

