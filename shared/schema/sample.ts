import type { Resume } from './types';
import { DEFAULT_THEME, SCHEMA_VERSION } from './types';

export const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);

/** 一份可直接改的示例简历：虚构人物，覆盖教育/工作/项目/技能/荣誉/自我评价。 */
export function createSampleResume(): Resume {
  return {
    id: uid(),
    name: '高望舒-软件开发',
    schemaVersion: SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    basics: {
      name: '高望舒',
      photo: '',
      fields: [
        { id: uid(), type: 'gender', label: '', value: '男', visible: true },
        { id: uid(), type: 'age', label: '', value: '28', visible: true },
        { id: uid(), type: 'city', label: '', value: '杭州', visible: true },
        { id: uid(), type: 'years', label: '', value: '5', visible: true },
        { id: uid(), type: 'phone', label: '', value: '13800138000', visible: true },
        { id: uid(), type: 'email', label: '', value: 'gaowangshu@example.com', visible: true },
        { id: uid(), type: 'github', label: '', value: 'https://github.com/gaowangshu', visible: true },
      ],
    },
    intent: {
      position: '软件开发工程师',
      city: '杭州',
      salary: '25000',
      availability: '一个月内到岗',
    },
    sections: [
      {
        id: uid(),
        kind: 'summary',
        title: '职业概述',
        visible: true,
        html:
          '<p>5 年后端研发经验，长期负责订单与履约方向的系统设计，熟悉高并发、分布式事务与稳定性治理；习惯用数据衡量结果，能独立推进跨团队项目。</p>',
      },
      {
        id: uid(),
        kind: 'skill',
        title: '专业技能',
        visible: true,
        items: [
          {
            id: uid(),
            summary:
              '<p>5 年 Java / Go 后端开发经验，熟悉高并发与分布式系统设计，有从 0 到 1 搭建中台与带团队的经验。</p>',
            groups: [
              { id: uid(), name: '后端开发', level: 90, label: '精通' },
              { id: uid(), name: '英语', level: 78, label: '良好' },
            ],
            keywords: 'Java、Go、Spring Cloud、MySQL、Redis、Kafka、Flink、Docker、Kubernetes',
          },
        ],
      },
      {
        id: uid(),
        kind: 'work',
        title: '工作经历',
        visible: true,
        items: [
          {
            id: uid(),
            company: '杭州云帆科技有限公司',
            role: '高级软件工程师',
            start: '2021-07',
            end: '',
            tags: ['上市公司'],
            desc:
              '<ul><li>负责订单履约链路重构，将单体应用拆分为 6 个微服务，峰值 QPS 从 800 提升到 4500，P99 延迟由 620ms 降到 180ms。</li>' +
              '<li>主导订单中心数据一致性方案，基于本地消息表 + 定时补偿，日均处理 120 万条消息，异常率低于 0.01%。</li>' +
              '<li>搭建团队 CI/CD 与灰度发布流程，发布耗时从 40 分钟缩短到 8 分钟，线上回滚 2 分钟内完成。</li>' +
              '<li>带 3 名初级工程师，负责代码评审与技术方案评审。</li></ul>',
          },
          {
            id: uid(),
            company: '杭州拾光网络科技有限公司',
            role: '软件开发工程师',
            start: '2019-07',
            end: '2021-06',
            tags: [],
            desc:
              '<ul><li>负责电商后台商品与库存模块，支撑日常 3000+ SKU 的维护与批量导入。</li>' +
              '<li>使用 Redis 缓存热点商品数据，商品详情页接口平均响应时间从 350ms 降到 90ms。</li>' +
              '<li>参与双十一大促保障，完成压测与限流降级方案，活动期间零故障。</li></ul>',
          },
        ],
      },
      {
        id: uid(),
        kind: 'project',
        title: '项目经历',
        visible: true,
        items: [
          {
            id: uid(),
            name: '「灯塔」实时数据看板',
            role: '技术负责人',
            start: '2023-03',
            end: '2023-11',
            tags: ['主导'],
            desc:
              '<ul><li>基于 Flink + ClickHouse 搭建实时指标链路，支持 200+ 指标秒级更新。</li>' +
              '<li>设计可配置图表方案，运营可自助搭建看板，需求交付周期从 3 天缩短到 2 小时。</li></ul>',
          },
          {
            id: uid(),
            name: '订单中台开放平台',
            role: '核心开发',
            start: '2022-04',
            end: '2022-10',
            tags: ['团队协作'],
            desc:
              '<ul><li>设计对外开放 API 与鉴权体系，接入 20+ 外部商家，日均调用 80 万次。</li>' +
              '<li>编写 SDK 与接入文档，外部接入平均耗时从 5 天降到 1 天。</li></ul>',
          },
        ],
      },
      {
        id: uid(),
        kind: 'education',
        title: '教育经历',
        visible: true,
        items: [
          {
            id: uid(),
            school: '浙江大学',
            major: '计算机科学与技术',
            degree: '本科',
            start: '2015-09',
            end: '2019-06',
            gpa: '3.8/4（专业前10%）',
            rank: '',
            tags: ['985', '双一流'],
            courses:
              '数据结构、算法设计与分析、操作系统、计算机网络、数据库系统、软件工程、编译原理、分布式系统',
          },
        ],
      },
      {
        id: uid(),
        kind: 'award',
        title: '证书与荣誉',
        visible: true,
        items: [
          { id: uid(), title: '软件设计师（中级）', date: '2018-11', desc: '全国计算机技术与软件专业技术资格' },
          { id: uid(), title: '大学英语六级', date: '2017-06', desc: 'CET-6，561 分' },
        ],
      },
    ],
    theme: { ...DEFAULT_THEME },
    meta: { templateId: 'minimal-blue', locale: 'zh-CN', page: 'A4' },
  };
}
