import { ipfs_hostname, ipfs_http_protocol } from "@/options";

export function format_bytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
export function format_percent(v: number): string {
  return (v * 100).toFixed(2) + "%";
}
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export function generate_links(cid: string, filename: string) {
  return [
    `${ipfs_http_protocol}//${cid}.ipfs.${ipfs_hostname}/?filename=${filename}&download=true`,
    `https://${cid}.ipfs.w3s.link/?filename=${filename}&download=true`,
    `https://crustwebsites.net/ipfs/${cid}?filename=${filename}&download=true`,
    `https://cloudflare-ipfs.com/ipfs/${cid}?filename=${filename}&download=true`,
    `https://gateway.pinata.cloud/ipfs/${cid}?filename=${filename}&download=true`,
    `https://ipfs.io/ipfs/${cid}?filename=${filename}&download=true`,
  ];
}
export function generate_filename(title: string, extension: string) {
  return (
    title
      .toLowerCase()
      .replaceAll(/[^\p{L}\p{N}]/gu, " ")
      .replaceAll(/\s+/gu, " ")
      .replaceAll(" ", "-") +
    "." +
    extension
  );
}

export function is_int(s: string) {
  return !isNaN(parseFloat(s));
}
