import http from "k6/http";
import { check } from "k6";
import { Counter } from "k6/metrics";

const frontend1 = new Counter("frontend1_requests");
const frontend2 = new Counter("frontend2_requests");
const frontend3 = new Counter("frontend3_requests");

export const options = {
  scenarios: {
    load_test: {
      executor: "constant-vus",
      vus: 50,
      duration: "20s",
    },
  },
};

export default function () {
  const res = http.get("http://localhost/api/server");

  check(res, {
    "status is 200": (r) => r.status === 200,
  });

  if (res.status !== 200) {
    return;
  }

  const body = res.json();

  switch (body.instance) {
    case "frontend-1":
      frontend1.add(1);
      break;
    case "frontend-2":
      frontend2.add(1);
      break;
    case "frontend-3":
      frontend3.add(1);
      break;
  }
}
