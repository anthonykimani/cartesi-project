// XXX even though ethers is not used in the code below, it's very likely
// it will be used by any DApp, so we are already including it here
const { ethers } = require("ethers");

const rollup_server = process.env.ROLLUP_HTTP_SERVER_URL;
console.log("HTTP rollup_server url is " + rollup_server);

let quizState = {
  question: "What is 2 + 2?",
  answer: "4",
  userAnswer: null,
  score: 0,
};

async function handle_advance(data) {
  console.log("Received advance request data " + JSON.stringify(data));

  const userAnswer = data.metadata.input.toString();

  if (userAnswer === quizState.answer) {
    quizState.score += 1;
  }

  quizState.userAnswer = userAnswer;

  console.log("Updated quiz state:", quizState);

  return "accept";
}

async function handle_inspect(data) {
  console.log("Received inspect request data " + JSON.stringify(data));

  const state = {
    question: quizState.question,
    score: quizState.score,
  };

  console.log("Current quiz state:", state);

  return "accept";
}

var handlers = {
  advance_state: handle_advance,
  inspect_state: handle_inspect,
};

var finish = { status: "accept" };

(async () => {
  while (true) {
    const finish_req = await fetch(rollup_server + "/finish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(finish),
    });

    console.log("Received finish status " + finish_req.status);

    if (finish_req.status === 202) {
      console.log("No pending rollup request, trying again");
    } else if (finish_req.status === 200) {
      const rollup_req = await finish_req.json();
      var handler = handlers[rollup_req["request_type"]];
      finish["status"] = await handler(rollup_req["data"]);
    }
  }
})();
