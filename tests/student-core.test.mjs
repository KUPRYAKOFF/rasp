import test from 'node:test';
import assert from 'node:assert/strict';
import {pairTime,slideGroups,initialSlide,weekMonday,dayDate,boardParity,visibleGroups} from '../schedule-core.mjs';

test('three-day and two-day slider groups cover Monday–Saturday once', () => {
  assert.deepEqual(slideGroups('three'),[[1,2,3],[4,5,6]]);
  assert.deepEqual(slideGroups('two'),[[1,2],[3,4],[5,6]]);
  assert.deepEqual(slideGroups('week'),[[1,2,3,4,5,6]]);
});

test('first visible slide includes today, or next Monday on Sunday', () => {
  assert.equal(initialSlide('three',new Date('2026-11-18T04:00:00Z')),0);
  assert.equal(initialSlide('three',new Date('2026-11-20T04:00:00Z')),1);
  assert.equal(initialSlide('two',new Date('2026-11-18T04:00:00Z')),1);
  assert.equal(initialSlide('two',new Date('2026-11-21T04:00:00Z')),2);
  assert.equal(initialSlide('two',new Date('2026-11-22T04:00:00Z')),0);
});

test('Sunday starts following week and parity matches that week', () => {
  assert.equal(weekMonday(new Date('2026-11-22T04:00:00Z')).toISOString().slice(0,10),'2026-11-23');
  assert.equal(dayDate(6,new Date('2026-11-22T04:00:00Z')).toISOString().slice(0,10),'2026-11-28');
  const data={parityWeek:'четная',generatedAt:'2026-11-18T03:00:00Z'};
  assert.equal(boardParity(data,new Date('2026-11-18T04:00:00Z')),0);
  assert.equal(boardParity(data,new Date('2026-11-22T04:00:00Z')),1);
});

test('group selection is ordered by course then name', () => {
  const data={groups:[
    {id:15,course:3,shortName:'ИТ',visible:true},
    {id:12,course:1,shortName:'КСК',visible:true},
    {id:13,course:2,shortName:'ТИТО',visible:false},
    {id:14,course:1,shortName:'ИС',visible:true}
  ]};
  const groups=visibleGroups(data,new Date('2026-11-18T04:00:00Z'));
  assert.deepEqual(groups.map(group=>group.id),[14,12,15]);
  assert.equal(groups[0].label,'1ИС-26');
});

test('all five bell times match the regular, Tuesday and Saturday schedules', () => {
  const timesForDay = day => [1,2,3,4,5].map(pair => pairTime(day,pair));
  const regular = [
    ['08:30','10:00'],['10:20','11:50'],['12:30','14:00'],['14:10','15:40'],['15:50','17:20']
  ];
  for(const day of [1,3,4,5])assert.deepEqual(timesForDay(day),regular);
  assert.deepEqual(timesForDay(2),[
    ['08:30','10:00'],['10:20','11:50'],['13:20','14:50'],['15:00','16:30'],['16:40','18:10']
  ]);
  assert.deepEqual(timesForDay(6),[
    ['08:30','10:00'],['10:10','11:40'],['12:10','13:40'],['13:50','15:20'],['15:30','17:00']
  ]);
  assert.equal(pairTime(2,6),null);
});
