#!/usr/bin/env node
/**
 * RAG Skill Loader - 动态技能感知加载器
 *
 * 基于用户任务内容，自动检测并加载相关技能
 * 无感知运行，零打扰
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const RAG_DIR = path.join(PROJECT_DIR, '.claude/rag');
const SKILL_INDEX_FILE = path.join(RAG_DIR, 'skill-index.json');
const SKILLS_DIR = path.join(PROJECT_DIR, '.claude/skills');

// 技能关键词匹配权重
const KEYWORD_WEIGHTS = {
  exact: 1.0,      // 完全匹配
  partial: 0.8,    // 部分匹配
  related: 0.5     // 相关匹配
};

// 加载技能索引
function loadSkillIndex() {
  if (!fs.existsSync(SKILL_INDEX_FILE)) {
    return { skills: [], auto_load: { enabled: false } };
  }
  try {
    return JSON.parse(fs.readFileSync(SKILL_INDEX_FILE, 'utf-8'));
  } catch (e) {
    return { skills: [], auto_load: { enabled: false } };
  }
}

// 分析用户输入，提取关键词
function analyzeInput(input) {
  const toolName = process.env.CLAUDE_TOOL_NAME || '';
  const lowerInput = input.toLowerCase();

  // 关键词提取
  const keywords = [
    // 前端相关
    'frontend', 'ui', 'react', 'vue', 'component', 'design', 'styling', 'css', 'tailwind',
    // 文档相关
    'document', 'docx', 'word', 'pdf', 'ppt', 'slide', 'spreadsheet', 'excel', 'xlsx',
    // 艺术相关
    'art', 'design', 'creative', 'poster', 'generative', 'algorithmic', 'canvas',
    // 测试相关
    'test', 'testing', 'e2e', 'automation', 'browser',
    // Agent 相关
    'agent', 'orchestration', 'workflow', 'multi-agent',
    // 工具相关
    'mcp', 'api', 'server', 'integration', 'cli'
  ];

  const found = keywords.filter(k => lowerInput.includes(k));
  return {
    keywords: found,
    toolName,
    inputLength: input.length
  };
}

// 匹配技能
function matchSkills(analysis, skillIndex) {
  const { keywords, toolName } = analysis;
  const matches = [];

  for (const skill of skillIndex.skills) {
    let score = 0;
    let matchedKeywords = [];

    for (const keyword of keywords) {
      for (const skillKeyword of skill.keywords) {
        if (skillKeyword === keyword) {
          score += KEYWORD_WEIGHTS.exact;
          matchedKeywords.push(keyword);
        } else if (skillKeyword.includes(keyword) || keyword.includes(skillKeyword)) {
          score += KEYWORD_WEIGHTS.partial;
          matchedKeywords.push(keyword);
        }
      }
    }

    // 工具名称匹配
    if (toolName && skill.keywords.some(k => toolName.toLowerCase().includes(k))) {
      score += KEYWORD_WEIGHTS.related;
    }

    if (score > 0) {
      matches.push({
        name: skill.name,
        score: score,
        keywords: matchedKeywords,
        description: skill.description
      });
    }
  }

  // 按分数排序
  return matches.sort((a, b) => b.score - a.score);
}

// 生成技能加载提示
function generateSkillLoadHint(matches) {
  if (matches.length === 0) {
    return '';
  }

  const topMatches = matches.slice(0, 3);
  const skillNames = topMatches.map(m => m.name).join(', ');

  return `
🧠 [RAG] 检测到相关技能: ${skillNames}

使用方式: openskills read <skill-name>

匹配详情:
${topMatches.map(m => `  - ${m.name}: ${(m.score).toFixed(1)} (${m.keywords.join(', ')})`).join('\n')}
`;
}

// 主函数 - 完全静默，输出到文件
function main() {
  try {
    const skillIndex = loadSkillIndex();
    if (!skillIndex.auto_load?.enabled) {
      process.exit(0);
    }

    const toolInput = process.env.CLAUDE_TOOL_INPUT || '';
    if (!toolInput || toolInput.length < 10) {
      process.exit(0);
    }

    const analysis = analyzeInput(toolInput);
    if (analysis.keywords.length === 0) {
      process.exit(0);
    }

    const matches = matchSkills(analysis, skillIndex);
    if (matches.length === 0) {
      process.exit(0);
    }

    // 将提示写入文件供 AI 阅读
    const hint = generateSkillLoadHint(matches);
    const hintFile = path.join(RAG_DIR, '.skill-hint.txt');
    fs.writeFileSync(hintFile, hint + '\n');

  } catch (e) {
    // 完全静默
  }

  process.exit(0);
}

main();
