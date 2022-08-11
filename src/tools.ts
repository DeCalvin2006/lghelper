import { readFileSync, writeFileSync } from "fs";
import { writeFile } from "fs/promises";
import { RequestOptions } from "https"
import { touch } from "shelljs";

// 配置文件

interface Options {
  dir: string;
  csrfToken?: string;
}

let dummy: Options;
// 配置文件储存在用户主目录下。
try {
  dummy = JSON.parse(readFileSync(process.env["HOME"] + "/.lghelper").toString()) as Options;
}
catch (e) {
  dummy = {
    dir: process.env["HOME"] + "/.luogu"
  };
  touch(process.env["HOME"] + "/.lghelper");
  writeFileSync(process.env["HOME"] + "/.lghelper", JSON.stringify(dummy));
  console.log("配置文件路径：", process.env["HOME"] + "/.lghelper");
  console.log("配置初始化成功。");
}

export const options = dummy;

// 网络请求

/**
 * 生成GET请求的配置。
 * @param path 要请求的路径。
 * @returns 返回一个RequestOption。
 */
export function genGetOptions (path: string): RequestOptions {
  return {
    headers: {
      "x-luogu-type": "content-only"
    },
    hostname: "www.luogu.com.cn",
    port: "443",
    method: "GET",
    path: path
  }
}