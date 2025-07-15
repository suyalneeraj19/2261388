export async function Log(
    stack : "frontend" | "backend",
    level : "info" | "error" | "warn" | "debug" | "fatal",
    pkg : "api" | "component" | "hook" | "page" | "state" | "style" | "cache" | "controller" | "cron_job" | "db" | "repository" | "route" | "service", 
    message : string,
) {
    await fetch("http://20.244.56.144/evaluation-service/logs", {
        method : "POST",
         headers : {
                "Content-Type" : "application/json",
                "Authorization" : "Bearer " + process.env.REACT_APP_ACCESS_TOKEN,
            },
        body : JSON.stringify({
            stack,
            level,
            package : pkg , message
        }),
    });
}

