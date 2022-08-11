import { createCommand } from "commander";
import { genGetOptions, options } from "./tools";
import { request } from "https";
import { ProblemResult } from "./extend";
import { mkdir, touch } from "shelljs"
import { exit } from "process";
import { writeFileSync } from "fs";
import { ProblemDetails } from "./luogu-api";
function getProblemStatus (pid: string): void {

  const options = genGetOptions("/problem/" + pid);

  console.log(`Parsing ${pid}...\n`);
  const req = request(options, (res) => {
    let data = "";
    // 所有data全部读完再parse
    // 这里为什么不直接读完就parse而是累积
    // 以后会出博客专门讲这一点
    res.on("data", (d: Buffer) => {
      data += d.toString();
    })
    res.on("close", () => {
      console.log(`Got data. Parsing...`);
      parseProblem((JSON.parse(data) as ProblemResult).currentData.problem);
    })

  })
  req.on("error", (err) => {
    console.error("Error!");
    console.error(err);
    exit(1);
  })
  req.end();
}

/**
 * 拼接出完整题面。
 * @param problem 接收到的题目数据。
 */
function genFullProblemContent (problem: ProblemDetails): string {
  // 前部包括题目的主要信息。
  const front =
    `# ${problem.pid} ${problem.title}
测试点数量:${problem.limits.time.length}
## 题目背景
${problem.background}
## 题目内容
${problem.description}
## 输入格式
${problem.inputFormat}
## 输出格式
${problem.outputFormat}
## 样例
`;
  // 中部包括样例以及翻译。
  let middle = "";
  let count = 1;
  problem.samples.forEach((element) => {
    middle += `### 输入#${count}\n`;
    middle += "```\n";
    middle += element.at(0);
    middle += "```\n";
    middle += `### 输出#${count}\n`;
    middle += "```\n";
    middle += element.at(1);
    middle += "```\n";
    count++;
  });
  if (problem.translation) {
    middle += `## 翻译
${problem.translation}
`
  }
  // 尾部，包括说明/提示和时间/空间限制。
  let back = `## 说明/提示
${problem.hint}


`
  const timeS = new Array<[number, number, number]>;
  const time = problem.limits.time;
  shortenLimits(timeS, time);
  back += "Time Limits:\n"
  timeS.forEach((element) => {
    back += `Test ${element.at(0)}-${element.at(1)}:${element.at(2)}ms` + "\n";
  });

  const memoryS = new Array<[number, number, number]>;
  const memory = problem.limits.memory;
  shortenLimits(memoryS, memory);

  back += "Memory Limits:\n"
  memoryS.forEach((element) => {
    back += `Test ${element.at(0)}-${element.at(1)}:${element.at(2)}KB` + "\n";
  });
  return front + middle + back;
}

function shortenLimits (shorten: [number, number, number][], input: number[]) {
  shorten.push([1, 1, input[0]]);
  for (let i = 1; i < input.length; i++) {
    if (input.at(i) == shorten[shorten.length - 1][2]) {
      shorten[shorten.length - 1][1] = i + 1;
    } else { shorten.push([i + 1, i + 1, input[i]]); }
  }
}

/**
 * 处理数据，生成题面文件和数据文件。
 * @param data 得到的题目数据。
 */
function parseProblem (problem: ProblemDetails) {
  const newDir = options.dir + "/" + problem.pid + "/";

  mkdir("-p", newDir);
  console.log("Created Dirs:", newDir);

  touch(newDir + problem.pid + ".md");
  writeFileSync(newDir + problem.pid + ".md", genFullProblemContent(problem));
  console.log("Problem saved at " + newDir + problem.pid + ".md");

  // console.log(genFullProblemContent(problem));
}

export const parse = createCommand("parse")
  .description("Parse a Problem from OJ")
  .argument("<pid>", "Problem ID")
  .action(pid => {
    getProblemStatus(pid);
  });