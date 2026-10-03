import { test, after } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { createRequire } from "node:module"
import ts from "typescript"
const externalRequire = createRequire(import.meta.url)

// Compile repository modules in memory; database calls use disposable SQLite.
// No .env files or application credentials are loaded by this test process.
const root = path.resolve(import.meta.dirname, "..")
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "dompeto-tests-"))
const database = path.join(temp, "test.sqlite")
const schema = fs
	.readFileSync(path.join(root, "scripts/migrate-db.mjs"), "utf8")
	.split("const schema = `")[1]
	.split("`")[0]
const python = `import sqlite3,json,sys
p=json.load(sys.stdin)
c=sqlite3.connect(p['database'])
c.row_factory=sqlite3.Row
try:
 if 'schema' in p:
  c.executescript(p['schema'])
  out=[]
 else:
  out=[]
  for statement in p['statements']:
   cursor=c.execute(statement['sql'],statement.get('args',[]))
   out.append({'rows':[dict(row) for row in cursor.fetchall()] if cursor.description else []})
 c.commit()
 print(json.dumps(out))
finally:
 c.close()
`
function sql(input) {
	const result = spawnSync("python3", ["-c", python], {
		input: JSON.stringify({ database, ...input }),
		encoding: "utf8",
	})
	if (result.status) throw new Error(result.stderr)
	return JSON.parse(result.stdout)
}
sql({ schema })
const db = {
	async execute(statement) {
		return sql({
			statements: [
				typeof statement === "string" ? { sql: statement } : statement,
			],
		})[0]
	},
	async batch(statements) {
		return sql({ statements })
	},
}
const cache = new Map()
function load(file) {
	file = path.resolve(root, file)
	if (!path.extname(file)) file += ".ts"
	if (cache.has(file)) return cache.get(file).exports
	const compiled = { exports: {} }
	cache.set(file, compiled)
	const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
		compilerOptions: {
			module: ts.ModuleKind.CommonJS,
			target: ts.ScriptTarget.ES2022,
		},
	}).outputText
	const requireLocal = (name) =>
		name === "@/lib/db"
			? { db }
			: name.startsWith("@/")
				? load(name.slice(2))
				: name.startsWith(".")
					? load(path.resolve(path.dirname(file), name))
					: externalRequire(name)
	new Function("require", "module", "exports", code)(
		requireLocal,
		compiled,
		compiled.exports,
	)
	return compiled.exports
}
const { salaryCycle, budgetSummary, validateTransaction } =
	load("lib/finance.ts")
const { getJakartaISODate } = load("lib/date-utils.ts")
const today = getJakartaISODate()
const valid = {
	amount: 500000,
	type: "expense",
	category_id: 1,
	date: today,
	description: "Pengeluaran contoh",
	notes: "",
	include_in_budget: 1,
}
const request = (body) =>
	new Request("http://localhost/api/transactions", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	})
after(() => fs.rmSync(temp, { recursive: true, force: true }))

test("salary cycle clamps short months and uses exclusive next boundary", () => {
	assert.deepEqual(salaryCycle(31, "2024-02-29"), {
		start: "2024-02-29",
		end: "2024-03-31",
		salary_day: 31,
		daysLeft: 31,
	})
	assert.equal(salaryCycle(31, "2025-02-28").start, "2025-02-28")
	assert.equal(salaryCycle(31, "2025-02-27").start, "2025-01-31")
	assert.equal(salaryCycle(25, "2026-01-01").start, "2025-12-25")
	assert.equal(salaryCycle(31, "2024-03-01", -1).start, "2024-01-31")
	assert.equal(salaryCycle(25, "2026-10-03", -1).daysLeft, 0)
})
test("budget keeps signed remaining and clamps visual percentage", () => {
	assert.deepEqual(budgetSummary(3000000, 500000), {
		budget: 3000000,
		spent: 500000,
		remaining: 2500000,
		percent: (2500000 / 3000000) * 100,
	})
	assert.equal(budgetSummary(100, 200).remaining, -100)
	assert.equal(budgetSummary(100, 200).percent, 0)
	assert.equal(budgetSummary(0, 0).percent, 0)
})
test("validation rejects impossible dates, unsafe amounts and invalid flags", () => {
	for (const patch of [
		{ date: "2025-02-29" },
		{ date: "2024-04-31" },
		{ amount: 0 },
		{ amount: -1 },
		{ amount: 1.2 },
		{ amount: Number.MAX_SAFE_INTEGER + 1 },
		{ amount: "25000" },
		{ type: "other" },
		{ category_id: 0 },
		{ description: " " },
		{ include_in_budget: 2 },
	])
		assert.throws(() => validateTransaction({ ...valid, ...patch }))
	assert.equal(
		validateTransaction({ ...valid, type: "income", category_id: 9 })
			.include_in_budget,
		0,
	)
})
test("manual / edit / confirm / atomic scan and all statistics agree", async () => {
	const manual = load("app/api/transactions/manual/route.ts")
	const confirm = load("app/api/transactions/confirm/route.ts")
	const bulk = load("app/api/transactions/bulk/route.ts")
	const detail = load("app/api/transactions/[id]/route.ts")
	await db.execute(
		"UPDATE settings SET value='3000000' WHERE key='monthly_budget'",
	)
	let response = await manual.POST(request(valid))
	assert.equal(response.status, 201)
	const expense = await response.json()
	assert.equal(expense.ai_confirmed, 0)
	assert.equal(expense.raw_input, valid.description)
	response = await manual.POST(
		request({
			...valid,
			type: "income",
			amount: 10000000,
			category_id: 9,
			description: "Gaji",
		}),
	)
	assert.equal(response.status, 201)
	assert.equal((await response.json()).include_in_budget, 0)
	// Older income flags must also not inflate budget.
	await db.execute(
		"UPDATE transactions SET include_in_budget=1 WHERE type='income'",
	)
	assert.equal(
		(
			await manual.POST(
				request({ ...valid, amount: 200000, include_in_budget: 0 }),
			)
		).status,
		201,
	)
	assert.equal(
		(await manual.POST(request({ ...valid, category_id: 9 }))).status,
		400,
	)
	assert.equal(
		(await manual.POST(request({ ...valid, amount: 0 }))).status,
		400,
	)
	const dashboard = await (
		await load("app/api/stats/dashboard/route.ts").GET()
	).json()
	const charts = await (
		await load("app/api/stats/charts/route.ts").GET(
			new Request("http://localhost/api/stats/charts"),
		)
	).json()
	assert.equal(dashboard.cycle.remaining, 2500000)
	assert.equal(dashboard.cycle.expense, 700000)
	assert.equal(dashboard.cycle.income, 10000000)
	assert.equal(dashboard.spentToday, 700000)
	assert.equal(dashboard.balance, 9300000)
	assert.deepEqual(charts.cycle, dashboard.cycle)
	assert.equal(charts.daily.at(-1).excludedAmount, 200000)
	response = await detail.PATCH(
		request({ ...valid, amount: 600000, notes: "Diperbarui" }),
		{ params: Promise.resolve({ id: String(expense.id) }) },
	)
	assert.equal(response.status, 200)
	assert.equal(
		(
			await db.execute({
				sql: "SELECT notes FROM transactions WHERE id=?",
				args: [expense.id],
			})
		).rows[0].notes,
		"Diperbarui",
	)
	assert.equal(
		(await confirm.POST(request({ ...valid, rawInput: "makan 500k" }))).status,
		201,
	)
	const before = (
		await db.execute("SELECT COUNT(*) AS count FROM transactions")
	).rows[0].count
	assert.equal(
		(
			await bulk.POST(
				request({
					date: today,
					items: [
						{ name: "Kopi", amount: 20000, category: "Makan & Minuman" },
						{ name: "Invalid", amount: 0, category: "Makan & Minuman" },
					],
				}),
			)
		).status,
		400,
	)
	assert.equal(
		(await db.execute("SELECT COUNT(*) AS count FROM transactions")).rows[0]
			.count,
		before,
	)
	assert.equal(
		(
			await bulk.POST(
				request({
					date: today,
					items: [{ name: "Kopi", amount: 20000, category: "Makan & Minuman" }],
				}),
			)
		).status,
		201,
	)
	assert.equal(
		(
			await detail.DELETE(request({}), {
				params: Promise.resolve({ id: String(expense.id) }),
			})
		).status,
		200,
	)
	const settings = load("app/api/settings/route.ts")
	assert.equal(
		(await settings.POST(request({ salary_day: 32, monthly_budget: 5000 })))
			.status,
		400,
	)
	assert.equal(
		(await settings.POST(request({ salary_day: 31, monthly_budget: 0 })))
			.status,
		200,
	)
})

test("theme text and input boundaries meet contrast targets", () => {
 const css = fs.readFileSync(path.join(root, "app/globals.css"), "utf8")
 const tokens = Object.fromEntries([...css.matchAll(/--([\w-]+):\s*(#[\da-fA-F]{6})/g)].map(([,name,value])=>[name,value]))
 const luminance = hex => {
  const rgb = hex.slice(1).match(/../g).map(c=>parseInt(c,16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4)
  return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722
 }
 const contrast = (a,b) => (Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05)
 for(const background of ["background","surface","surface-raised"]){
  for(const foreground of ["foreground","muted-foreground","primary","expense","warning","info"]){
   assert.ok(contrast(tokens[foreground],tokens[background])>=4.5,`${foreground} on ${background}`)
  }
  assert.ok(contrast(tokens.input,tokens[background])>=3,`input border on ${background}`)
 }
 assert.ok(contrast(tokens["primary-foreground"],tokens.primary)>=4.5)
})
