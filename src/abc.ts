import {CoverityApiService} from "./coverity-api";

var apiService = new CoverityApiService("https://poc376.coverity.synopsys.com/", "admin", "9Iis?3g!W?B63yonyp0!01!");

let offset = 0;
let totalRows = Number.POSITIVE_INFINITY;

(async () => {
        while (offset < totalRows) {
            console.log("checking " + offset)
            var covProjectIssues = apiService.findIssues("starling-core", offset, 200);
            let issue = await covProjectIssues;
            console.log(issue.totalRows)
            for (const i in issue.rows) {
                const cell = issue.rows[i];
                for (const j in cell) {
                    const entry = cell[j];
                    if (entry.key == "cid" && entry.value == "37293") {
                        console.log(cell)
                    }
                }
            }
            totalRows = issue.totalRows;
            offset += 200;
        }
    }
)
();