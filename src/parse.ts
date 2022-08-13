import { createCommand } from "commander";
import { genGetOptions, options } from "./tools";
import { request } from "https";
import { ProblemResult } from "./extend";
import { mkdir, touch } from "shelljs"
import { exit } from "process";
import { writeFileSync } from "fs";
import { ProblemDetails } from "./luogu-api";

/**
 * 从OJ获取题目信息。
 * @param pid 题目编号。
 */
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
  // 中部包括样例。
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
  // 尾部，包括翻译、说明/提示和时间/空间限制。
  let back = `## 说明/提示
  ${problem.hint}
  
  
  `
  if (problem.translation) {
    back = `## 翻译
${problem.translation}
`+ back
  }
  const timeS = new Array<[number, number, number]>;
  const time = problem.limits.time;
  shortenLimits(timeS, time);
  back += "时间限制:\n"
  timeS.forEach((element) => {
    back += `Test ${element.at(0)}-${element.at(1)}:${element.at(2)}ms` + "\n";
  });

  const memoryS = new Array<[number, number, number]>;
  const memory = problem.limits.memory;
  shortenLimits(memoryS, memory);

  back += "内存限制。:\n"
  memoryS.forEach((element) => {
    back += `Test ${element.at(0)}-${element.at(1)}:${element.at(2)}KB` + "\n";
  });
  return front + middle + back;
}

/**
 * 将数组归并成区间表示。
 * @param shorten 输出。
 * @param input 输入。
 * @example 
 * let shorten = new Array<[number, number, number]>;
 * let input = [1, 1, 1, 2, 3];
 * shortenLimits(shorten, input);
 * console.log(shorten);// should be [[1,3,1],[4,4,2],[5,5,3]]
 */
function shortenLimits (shorten: [number, number, number][], input: number[]): void {
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
  const newDir = `${options.dir}/${problem.pid}/`;

  mkdir("-p", newDir);
  console.log("创建目录:", newDir);

  touch(newDir + problem.pid + ".md");
  writeFileSync(`${newDir}${problem.pid}.md`, genFullProblemContent(problem));
  console.log(`题目内容保存在 ${newDir}${problem.pid}.md`);

  console.log(`本题拥有 ${problem.samples.length} 个样例。正在生成测试数据文件……`);
  let count = 1;
  problem.samples.forEach(element => {
    touch(`${newDir}/in${count}.txt`);
    writeFileSync(`${newDir}/in${count}.txt`, element[0]);
    touch(`${newDir}/out${count}.txt`);
    writeFileSync(`${newDir}/out${count}.txt`, element[1]);
    count++;
  });
  console.log("测试数据文件生成成功。");
}

export const parse = createCommand("parse")
  .description("Parse a Problem from OJ")
  .argument("<pid>", "Problem ID")
  .action(pid => {
    getProblemStatus(pid);
  });