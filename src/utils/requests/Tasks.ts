export const fetchTasksRequest = async (workspaceSid: string, token: string) => {
    const response = await fetch(`https://taskrouter.twilio.com/v1/Workspaces/${workspaceSid}/Tasks`, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });

    return response.json();
};
