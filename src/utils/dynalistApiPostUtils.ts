import type { DynalistApiResultBase } from "../types/dynalist";

/**
 * Updates a Dynalist document with the given changes.
 * @param {string} file_id - The Dynalist file ID.
 * @param {unknown[]} changes - The list of changes to apply.
 * @param {string} accessToken - The Dynalist API access token.
 * @returns {Promise<DynalistApiResultBase>} The result of the update operation.
 */
export function updateDynalist(
    file_id: string,
    changes: unknown[],
    accessToken: string,
): Promise<DynalistApiResultBase> {
    const payload = {
        token: accessToken,
        file_id,
        changes,
    };

    return fetch("https://dynalist.io/api/v1/doc/edit", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    })
        .then((response) =>
            response
                .json()
                .then((data: unknown) => ({ response, data, jsonError: false }))
                .catch(() => ({ response, data: null, jsonError: true })),
        )
        .then((result) => {
            if (result.jsonError) {
                return { error: "Failed to parse Dynalist response as JSON" };
            }

            const data = result.data;

            if (result.response.ok) {
                const new_node_ids = (data as { new_node_ids?: string[] }).new_node_ids;
                return { data, new_node_ids };
            } else {
                return { error: "Network response was not ok", data };
            }
        })
        .catch((error) => ({
            error: (error as Error)?.message || "Network or other error during update",
        }));
}
