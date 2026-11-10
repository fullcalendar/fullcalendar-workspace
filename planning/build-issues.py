"""Builds planning/ISSUES.md from the title, status, release, test and issues lines of every file in
bugs/, features/, ideas/ and behaviors/. Run it after adding or changing one:

    python3 planning/build-issues.py
"""

import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))

FOLDERS = [
    ('bugs', 'Bugs', 'FullCalendar does something wrong, and we know what right is.', ['confirmed', 'fixed']),
    ('features', 'Features', 'A new API with an agreed design, ready to build.', ['designed', 'building', 'shipped']),
    ('ideas', 'Ideas', "A real need whose design or fix isn't settled yet.", ['open', 'parked']),
    ('behaviors', 'Behaviors', 'Intended or arguable behavior: document it, change it in a major version, or promote it to a bug.', ['arguable', 'intended']),
]

RELEASES = [
    ('next', 'Next v7 release', 'non-breaking, after the test revamp merges'),
    ('v8', 'v8', 'breaking, for the next major version'),
    ('', 'Not triaged', ''),
]

INTRO = """# Issues

Bugs, features, ideas and behaviors in FullCalendar itself, found during the test revamp. One file per item, sorted into a folder by kind. Each file opens with its title and a **Status**, **Release**, **Test** and **Issues** line. This index is generated: after adding or changing a file, run `python3 planning/build-issues.py`.

| Folder | Holds | Statuses |
|---|---|---|
{folders}

**Release** is {releases}.

**Test** is where the suites cover it. For a bug it's an `it.fails` test, which passes while the bug exists and fails once it's fixed: then change it to `it`. For a behavior, the test asserts what happens today. `standard/.../` is `standard/packages/vanilla-tests/`, `premium/.../` is `premium/packages/vanilla-scheduler-tests/`.

**Issues** are matching FullCalendar GitHub issues, as of their last check. In the table, *closed* marks a closed issue and *related* one that isn't the same problem but bears on it; the file says how.
"""


def read_item(path):
    lines = open(path).read().split('\n')
    item = {'title': lines[0][2:].strip(), 'status': '', 'release': '', 'test': '', 'issues': ''}
    for line in lines[1:8]:
        m = re.match(r'\*\*(Status|Release|Test|Issues):\*\* (.*)', line)
        if m:
            item[m.group(1).lower()] = m.group(2).strip()
    # in the table, an issue is its link, marked when it's closed or only related
    item['issues'] = ', '.join(
        link + (f' ({", ".join(marks)})' if marks else '')
        for link, note in re.findall(r'(\[#\d+\]\([^)]+\))(?: \(([^)]*)\))?', item['issues'])
        for marks in [[m for m in ('closed', 'related') if m in note]]
    )
    # in the table, a test is its path within the test package's src/
    item['test'] = ', '.join(f'`{p}`' for p in re.findall(r'`[^`]*/src/([^`]+)`', item['test']))
    return item


def main():
    items = {}
    for folder, *_ in FOLDERS:
        d = os.path.join(HERE, folder)
        items[folder] = []
        for fn in sorted(os.listdir(d)) if os.path.isdir(d) else []:
            if fn.endswith('.md'):
                item = read_item(os.path.join(d, fn))
                item['link'] = f'{folder}/{fn}'
                items[folder].append(item)

    out = INTRO.format(
        folders='\n'.join(f'| `{f}/` | {desc} | {", ".join(f"`{s}`" for s in statuses)} |' for f, _, desc, statuses in FOLDERS),
        releases=' or '.join(f'`{r}` ({desc})' for r, _, desc in RELEASES if r),
    )

    for folder, heading, _, statuses in FOLDERS:
        out += f'\n## {heading}\n'
        if not items[folder]:
            out += '\nNone yet.\n'
            continue
        for release, subheading, _ in RELEASES:
            rows = sorted(
                (i for i in items[folder] if i['release'] == release),
                key=lambda i: (statuses.index(i['status']) if i['status'] in statuses else 99, i['title'].lower().strip('`"')),
            )
            if not rows:
                continue
            out += f'\n### {subheading}\n\n| Item | Status | Test | Issues |\n|---|---|---|---|\n'
            for i in rows:
                out += f'| [{i["title"]}]({i["link"]}) | {i["status"]} | {i["test"]} | {i["issues"]} |\n'

    open(os.path.join(HERE, 'ISSUES.md'), 'w').write(out)

    known_releases = [r for r, *_ in RELEASES]
    for folder, _, _, statuses in FOLDERS:
        for i in items[folder]:
            if i['status'] not in statuses:
                print(f'warning: {folder}/ "{i["title"]}" has status "{i["status"]}"')
            if i['release'] not in known_releases:
                print(f'warning: {folder}/ "{i["title"]}" has release "{i["release"]}"')
            if folder == 'bugs' and i['status'] == 'confirmed' and not i['test']:
                print(f'warning: bugs/ "{i["title"]}" has no test')
    print(f'wrote ISSUES.md: {sum(len(v) for v in items.values())} items')


main()
