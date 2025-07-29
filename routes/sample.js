import remarkParse from "remark-parse";
import { unified } from "unified";
// import { removePosition } from "unist-util-remove-position";

const processor = unified().use(remarkParse);

const value = '```json {"score": 30, "breakdown:{"logic":5, techinial:20}}```';
const parseTree = processor.parse(value);
const tree = await processor.run(parseTree);

// removePosition(tree, { force: true });

console.dir(tree, { depth: null });
