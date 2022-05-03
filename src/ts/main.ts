const fs = require("fs");
const crypto = require("crypto");

const dataDir = String.raw`C:\Users\thomaseding\Desktop\point-click\pixel-art\0 - mine\cga-space_record`;
const destDir = `${dataDir}/__record`;

function hashFile(filePath: string): string {
    const buffer = fs.readFileSync(filePath);
    const md5sum = (crypto as any).createHash("md5");
    md5sum.update(buffer);
    return md5sum.digest("hex");
}

function compare<T>(x: T, y: T): number {
    if (x < y) return -1;
    if (x > y) return 1;
    return 0;
}

class FileInfo {
    static parser = /^[-a-z0-9_]*?(\d+)([-a-z_]*)\.png$/i;

    static compare(a: FileInfo, b: FileInfo): number {
        let c = compare(a.ordinal, b.ordinal);
        if (c !== 0) {
            return c;
        }
        return compare(a.suffix, b.suffix);
    }

    public constructor(dir: string, name: string) {
        this.dir = dir;
        this.name = name;
        const path = this.path();
        const result = FileInfo.parser.exec(name);
        this.ordinal = Number.parseInt(result![1]!);
        this.suffix = result![2]!;
        this.hash = hashFile(path);
        this.logicalIndex = -1;
    }

    public path(): string {
        return `${this.dir}/${this.name}`;
    }

    public readonly dir: string;
    public readonly name: string;
    public readonly ordinal: number;
    public readonly suffix: string;
    public readonly hash: string;
    public logicalIndex: number;
}

function getFileInfos(dir: string) {
    const filenames: string[] = fs.readdirSync(dir);
    const infos = filenames.map((name) => {
        return new FileInfo(dir, name);
    });
    infos.sort(FileInfo.compare);
    infos.forEach((info, index) => {
        info.logicalIndex = index;
    });
    return infos;
}

function collapse<T>(xs: T[], areSame: (a: T, b: T) => boolean): [T[], T[]] {
    const n = xs.length;
    if (n <= 1) {
        return [xs.slice(), []];
    }
    const rejects = [];
    let prev = xs[0]!;
    const ys = [prev];
    for (let i = 1; i < n; ++i) {
        const a = prev;
        const b = xs[i]!;
        if (areSame(a, b)) {
            rejects.push(b);
            continue;
        }
        ys.push(b);
        prev = b;
    }
    return [ys, rejects];
}

function collapseFileInfos(infos: FileInfo[]): FileInfo[] {
    const [result, _rejects] = collapse(infos, (a, b) => {
        return a.hash === b.hash;
    });
    result.forEach((info, index) => {
        info.logicalIndex = index;
    });

    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir);
    }
    result.forEach((info) => {
        const destPath = `${destDir}/__${info.logicalIndex}.png`;
        fs.copyFileSync(info.path(), destPath);
    });
    return result;
}

function main() {
    console.log(dataDir);
    let fileInfos = getFileInfos(dataDir);
    fileInfos = collapseFileInfos(fileInfos);
    console.log("done");
}

main();
