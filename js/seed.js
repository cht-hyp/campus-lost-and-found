(function (root) {
  'use strict';
  const examples = [
    [
      'lost',
      '蓝牙耳机',
      '数码设备',
      '图书馆二楼自习区',
      '白色耳机和充电盒，盒盖上有一张小小的蓝色贴纸。昨天自习结束后发现不见了，如果你有看到，麻烦联系我。',
      'open',
      0
    ],
    [
      'found',
      '校园卡',
      '证件卡片',
      '第一教学楼一层大厅',
      '捡到一张带透明卡套的校园卡，已妥善保管。请联系时说明姓名和卡号尾数，方便核对。',
      'open',
      1
    ],
    [
      'found',
      '一串钥匙',
      '钥匙',
      '东区食堂门口',
      '两把银色钥匙，挂着一个蓝色小挂件。在食堂门口的长椅旁捡到，失主可以联系认领。',
      'open',
      2
    ],
    [
      'lost',
      '浅蓝色保温杯',
      '生活用品',
      '教学楼 A 座 302',
      '浅蓝色的保温杯，杯底贴了一个名字标签。可能落在教室最后一排，谢谢帮忙留意的同学！',
      'open',
      3
    ],
    [
      'found',
      '高等数学笔记本',
      '书本文具',
      '图书馆三楼',
      '米白色线圈笔记本，内页有高数习题和课堂笔记。希望尽快交还给正在复习的主人。',
      'open',
      4
    ],
    [
      'lost',
      '米白色帆布包',
      '包袋',
      '西区操场看台',
      '米白色帆布袋，印有一颗小星星，里面有一本书。周末运动后遗落在看台附近。',
      'open',
      5
    ],
    [
      'found',
      '银色手链',
      '衣物饰品',
      '学生宿舍 6 号楼',
      '细款银色手链，在宿舍楼下花坛边拾到。物品已经归还给失主，感谢大家的帮助。',
      'resolved',
      6
    ],
    [
      'lost',
      '黑色折叠伞',
      '其他',
      '南校门附近',
      '黑色三折雨伞，伞柄有一道白色划痕。已经找回，感谢帮忙转发信息的同学。',
      'resolved',
      7
    ]
  ];
  const now = new Date();
  root.CampusSeed = examples.map((item, index) => {
    const occurred = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 1 - Math.floor(index / 3),
      8 + index,
      20
    );
    const pad = (value) => String(value).padStart(2, '0');
    const occurredAt = `${occurred.getFullYear()}-${pad(occurred.getMonth() + 1)}-${pad(occurred.getDate())}T${pad(occurred.getHours())}:${pad(occurred.getMinutes())}`;
    const published = new Date(now.getTime() - (index + 1) * 3600000).toISOString();
    return {
      id: `demo-${index + 1}`,
      ownerId: 'demo',
      type: item[0],
      title: item[1],
      category: item[2],
      location: item[3],
      description: item[4],
      status: item[5],
      occurredAt,
      contact: '示例微信：campus_demo（仅供演示）',
      createdAt: published,
      updatedAt: published
    };
  });
})(globalThis);
