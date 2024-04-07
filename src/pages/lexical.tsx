// reference:
// https://github.com/sodenn/lexical-beautiful-mentions
// https://github.com/facebook/lexical/blob/main/packages/lexical-playground/src/plugins/MentionsPlugin/index.tsx

import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { ClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin'
import type { InitialConfigType } from '@lexical/react/LexicalComposer'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { EditorRefPlugin } from '@lexical/react/LexicalEditorRefPlugin'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin'
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin'
import { useMemoizedFn } from 'ahooks'
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  NodeKey,
  SerializedLexicalNode,
  Spread,
  TextNode,
} from 'lexical'
import { $applyNodeReplacement, $getSelection, CLEAR_EDITOR_COMMAND, DecoratorNode } from 'lexical'
import { createPortal } from 'react-dom'

type SerializedMentionNode = Spread<
  {
    trigger: string
    value: string
    id: string
  },
  SerializedLexicalNode
>

function convertMentionElement(
  domNode: HTMLElement
): DOMConversionOutput | null {
  // const textContent = domNode.textContent
  const trigger = domNode.dataset.mentionTrigger
  const value = domNode.dataset.mentionValue
  const id = domNode.dataset.mentionId

  if (trigger !== undefined && value !== undefined && id !== undefined) {
    const node = $createMentionNode(trigger, value, id)
    return { node }
  }

  return null
}

class MentionNode extends DecoratorNode<JSX.Element> {
  #value: string
  #trigger: string
  #id: string

  static getType(): string {
    return 'mention'
  }

  static clone(node: MentionNode): MentionNode {
    return new MentionNode(node.#trigger, node.#value, node.#id, node.__key)
  }

  static importJSON(serializedNode: SerializedMentionNode): MentionNode {
    return $createMentionNode(serializedNode.trigger, serializedNode.value, serializedNode.id)
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('span')

    element.dataset.mentionTrigger = this.#trigger
    element.dataset.mentionValue = this.#value
    element.dataset.mentionId = this.#id
    element.textContent = this.getTextContent()
    element.dataset.mention = 'true'

    return { element }
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (!(domNode.dataset.mention === 'true')) {
          return null
        }
        return {
          conversion: convertMentionElement,
          priority: 0,
        }
      },
    }
  }

  constructor(trigger: string, value: string, id: string, key?: NodeKey) {
    super(key)
    this.#trigger = trigger
    this.#value = value
    this.#id = id
  }

  exportJSON(): SerializedMentionNode {
    return {
      trigger: this.#trigger,
      value: this.#value,
      id: this.#id,
      type: 'mention',
      version: 1,
    }
  }

  createDOM(config: EditorConfig, editor: LexicalEditor): HTMLElement {
    return document.createElement('span')
    // const dom = super.createDOM(config, editor)
    // dom.style.cssText = mentionStyle
    // dom.className = 'bg-green-6'
    // return dom
  }

  getTextContent(): string {
    return this.#trigger + this.#value
  }

  updateDOM(_prevNode: unknown, _dom: HTMLElement, _config: EditorConfig): boolean {
    return false
  }

  getTrigger() {
    const self = this.getLatest()
    return self.#trigger
  }

  getValue() {
    const self = this.getLatest()
    return self.#value
  }

  setValue(value: string) {
    const self = this.getWritable()
    self.#value = value
  }

  getID() {
    const self = this.getLatest()
    return self.#id
  }

  setID(id: string) {
    const self = this.getWritable()
    self.#id = id
  }

  component() {
    return null
  }

  decorate(editor: LexicalEditor, config: EditorConfig): JSX.Element {
    return (
      <MentionComponent
        trigger={this.#trigger}
        value={this.#value}
        id={this.#id}
        nodeKey={this.getKey()}
      />
    )
  }

  isKeyboardSelectable(): boolean {
    return false
  }
}

function $createMentionNode(trigger: string, value: string, id: string): MentionNode {
  const mentionNode = new MentionNode(trigger, value, id)
  // mentionNode.setMode('segmented').toggleDirectionless()
  return $applyNodeReplacement(mentionNode)
}

class MentionOptions extends MenuOption {
  constructor(id: string, public label: string, public avatar?: JSX.Element) {
    super(id)
  }
}

const initialConfig: InitialConfigType = {
  namespace: 'Lexical Editor',
  onError(error, editor) {
    console.error(error)
  },
  nodes: [
    MentionNode,
  ],
}

function MentionsMenuItem({
  index,
  isSelected,
  onClick,
  onMouseEnter,
  option,
}: {
  index: number
  isSelected: boolean
  onClick: () => void
  onMouseEnter: () => void
  option: MentionOptions
}) {
  return (
    <div
      key={option.key}
      className={clsx(
        'whitespace-nowrap',
        isSelected && 'bg-blueGray-7 text-white'
      )}
      // eslint-disable-next-line @typescript-eslint/unbound-method
      ref={option.setRefElement}
      tabIndex={-1}
      role="option"
      id={`mention-option-${index}`}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      aria-selected={isSelected}
    >
      {option.avatar}
      <span>{option.label}</span>
    </div>
  )
}

function useMentionLookupService(mentionString: string | null) {
  const [results, setResults] = useState<Array<string>>([])

  useEffect(() => {
    if (mentionString == null) {
      setResults([])
      return
    }

    if (mentionString === '') {
      setResults(dummyMentionsData.slice())
      return
    }

    const results = searchService(mentionString)
    setResults(results)
  }, [mentionString])

  return results
}

class LRUCache<K, V> extends Map<K, V> {
  constructor(
    public capacity: number,
    iterable?: Iterable<readonly [K, V]> | null
  ) {
    super(iterable)
  }

  set(key: K, value: V) {
    if (this.size >= this.capacity) {
      const firstKey = this.keys().next().value as K
      this.delete(firstKey)
    }
    super.set(key, value)
    return this
  }

  get(key: K) {
    const hasKey = this.has(key)
    if (!hasKey) return
    const value = super.get(key)!
    this.delete(key)
    super.set(key, value)
    return value
  }
}

function searchService(text: string) {
  const results = dummyMentionsData.filter(mention =>
    mention.toLowerCase().includes(text.toLowerCase())
  )

  return results
}

const mentionsCache = new LRUCache<string, Array<string> | null>(100)

const dummyMentionsData = [
  'Aayla Secura',
  'Adi Gallia',
  'Admiral Dodd Rancit',
  'Admiral Firmus Piett',
  'Admiral Gial Ackbar',
  'Admiral Ozzel',
  'Admiral Raddus',
  'Admiral Terrinald Screed',
  'Admiral Trench',
  'Admiral U.O. Statura',
  'Agen Kolar',
  'Agent Kallus',
  'Aiolin and Morit Astarte',
  'Aks Moe',
  'Almec',
  'Alton Kastle',
  'Amee',
  'AP-5',
  'Armitage Hux',
  'Artoo',
  'Arvel Crynyd',
  'Asajj Ventress',
  'Aurra Sing',
  'AZI-3',
  'Bala-Tik',
  'Barada',
  'Bargwill Tomder',
  'Baron Papanoida',
  'Barriss Offee',
  'Baze Malbus',
  'Bazine Netal',
  'BB-8',
  'BB-9E',
  'Ben Quadinaros',
  'Berch Teller',
  'Beru Lars',
  'Bib Fortuna',
  'Biggs Darklighter',
  'Black Krrsantan',
  'Bo-Katan Kryze',
  'Boba Fett',
  'Bobbajo',
  'Bodhi Rook',
  'Borvo the Hutt',
  'Boss Nass',
  'Bossk',
  'Breha Antilles-Organa',
  'Bren Derlin',
  'Brendol Hux',
  'BT-1',
  'C-3PO',
  'C1-10P',
  'Cad Bane',
  'Caluan Ematt',
  'Captain Gregor',
  'Captain Phasma',
  'Captain Quarsh Panaka',
  'Captain Rex',
  'Carlist Rieekan',
  'Casca Panzoro',
  'Cassian Andor',
  'Cassio Tagge',
  'Cham Syndulla',
  'Che Amanwe Papanoida',
  'Chewbacca',
  'Chi Eekway Papanoida',
  'Chief Chirpa',
  'Chirrut Îmwe',
  'Ciena Ree',
  'Cin Drallig',
  'Clegg Holdfast',
  'Cliegg Lars',
  'Coleman Kcaj',
  'Coleman Trebor',
  'Colonel Kaplan',
  'Commander Bly',
  'Commander Cody (CC-2224)',
  'Commander Fil (CC-3714)',
  'Commander Fox',
  'Commander Gree',
  'Commander Jet',
  'Commander Wolffe',
  'Conan Antonio Motti',
  'Conder Kyl',
  'Constable Zuvio',
  'Cordé',
  'Cpatain Typho',
  'Crix Madine',
  'Cut Lawquane',
  'Dak Ralter',
  'Dapp',
  'Darth Bane',
  'Darth Maul',
  'Darth Tyranus',
  'Daultay Dofine',
  'Del Meeko',
  'Delian Mors',
  'Dengar',
  'Depa Billaba',
  'Derek Klivian',
  'Dexter Jettster',
  'Dineé Ellberger',
  'DJ',
  'Doctor Aphra',
  'Doctor Evazan',
  'Dogma',
  'Dormé',
  'Dr. Cylo',
  'Droidbait',
  'Droopy McCool',
  'Dryden Vos',
  'Dud Bolt',
  'Ebe E. Endocott',
  'Echuu Shen-Jon',
  'Eeth Koth',
  'Eighth Brother',
  'Eirtaé',
  'Eli Vanto',
  'Ellé',
  'Ello Asty',
  'Embo',
  'Eneb Ray',
  'Enfys Nest',
  'EV-9D9',
  'Evaan Verlaine',
  'Even Piell',
  'Ezra Bridger',
  'Faro Argyus',
  'Feral',
  'Fifth Brother',
  'Finis Valorum',
  'Finn',
  'Fives',
  'FN-1824',
  'FN-2003',
  'Fodesinbeed Annodue',
  'Fulcrum',
  'FX-7',
  'GA-97',
  'Galen Erso',
  'Gallius Rax',
  'Garazeb "Zeb" Orrelios',
  'Gardulla the Hutt',
  'Garrick Versio',
  'Garven Dreis',
  'Gavyn Sykes',
  'Gideon Hask',
  'Gizor Dellso',
  'Gonk droid',
  'Grand Inquisitor',
  'Greeata Jendowanian',
  'Greedo',
  'Greer Sonnel',
  'Grievous',
  'Grummgar',
  'Gungi',
  'Hammerhead',
  'Han Solo',
  'Harter Kalonia',
  'Has Obbit',
  'Hera Syndulla',
  'Hevy',
  'Hondo Ohnaka',
  'Huyang',
  'Iden Versio',
  'IG-88',
  'Ima-Gun Di',
  'Inquisitors',
  'Inspector Thanoth',
  'Jabba',
  'Jacen Syndulla',
  'Jan Dodonna',
  'Jango Fett',
  'Janus Greejatus',
  'Jar Jar Binks',
  'Jas Emari',
  'Jaxxon',
  'Jek Tono Porkins',
  'Jeremoch Colton',
  'Jira',
  'Jobal Naberrie',
  'Jocasta Nu',
  'Joclad Danva',
  'Joh Yowza',
  'Jom Barell',
  'Joph Seastriker',
  'Jova Tarkin',
  'Jubnuk',
  'Jyn Erso',
  'K-2SO',
  'Kanan Jarrus',
  'Karbin',
  'Karina the Great',
  'Kes Dameron',
  'Ketsu Onyo',
  'Ki-Adi-Mundi',
  'King Katuunko',
  'Kit Fisto',
  'Kitster Banai',
  'Klaatu',
  'Klik-Klak',
  'Korr Sella',
  'Kylo Ren',
  'L3-37',
  'Lama Su',
  'Lando Calrissian',
  'Lanever Villecham',
  'Leia Organa',
  'Letta Turmond',
  'Lieutenant Kaydel Ko Connix',
  'Lieutenant Thire',
  'Lobot',
  'Logray',
  'Lok Durd',
  'Longo Two-Guns',
  'Lor San Tekka',
  'Lorth Needa',
  'Lott Dod',
  'Luke Skywalker',
  'Lumat',
  'Luminara Unduli',
  'Lux Bonteri',
  'Lyn Me',
  'Lyra Erso',
  'Mace Windu',
  'Malakili',
  'Mama the Hutt',
  'Mars Guo',
  'Mas Amedda',
  'Mawhonic',
  'Max Rebo',
  'Maximilian Veers',
  'Maz Kanata',
  'ME-8D9',
  'Meena Tills',
  'Mercurial Swift',
  'Mina Bonteri',
  'Miraj Scintel',
  'Mister Bones',
  'Mod Terrik',
  'Moden Canady',
  'Mon Mothma',
  'Moradmin Bast',
  'Moralo Eval',
  'Morley',
  'Mother Talzin',
  'Nahdar Vebb',
  'Nahdonnis Praji',
  'Nien Nunb',
  'Niima the Hutt',
  'Nines',
  'Norra Wexley',
  'Nute Gunray',
  'Nuvo Vindi',
  'Obi-Wan Kenobi',
  'Odd Ball',
  'Ody Mandrell',
  'Omi',
  'Onaconda Farr',
  'Oola',
  'OOM-9',
  'Oppo Rancisis',
  'Orn Free Taa',
  'Oro Dassyne',
  'Orrimarko',
  'Osi Sobeck',
  'Owen Lars',
  'Pablo-Jill',
  'Padmé Amidala',
  'Pagetti Rook',
  'Paige Tico',
  'Paploo',
  'Petty Officer Thanisson',
  'Pharl McQuarrie',
  'Plo Koon',
  'Po Nudo',
  'Poe Dameron',
  'Poggle the Lesser',
  'Pong Krell',
  'Pooja Naberrie',
  'PZ-4CO',
  'Quarrie',
  'Quay Tolsite',
  'Queen Apailana',
  'Queen Jamillia',
  'Queen Neeyutnee',
  'Qui-Gon Jinn',
  'Quiggold',
  'Quinlan Vos',
  'R2-D2',
  'R2-KT',
  'R3-S6',
  'R4-P17',
  'R5-D4',
  'RA-7',
  'Rabé',
  'Rako Hardeen',
  'Ransolm Casterfo',
  'Rappertunie',
  'Ratts Tyerell',
  'Raymus Antilles',
  'Ree-Yees',
  'Reeve Panzoro',
  'Rey',
  'Ric Olié',
  'Riff Tamson',
  'Riley',
  'Rinnriyin Di',
  'Rio Durant',
  'Rogue Squadron',
  'Romba',
  'Roos Tarpals',
  'Rose Tico',
  'Rotta the Hutt',
  'Rukh',
  'Rune Haako',
  'Rush Clovis',
  'Ruwee Naberrie',
  'Ryoo Naberrie',
  'Sabé',
  'Sabine Wren',
  'Saché',
  'Saelt-Marae',
  'Saesee Tiin',
  'Salacious B. Crumb',
  'San Hill',
  'Sana Starros',
  'Sarco Plank',
  'Sarkli',
  'Satine Kryze',
  'Savage Opress',
  'Sebulba',
  'Senator Organa',
  'Sergeant Kreel',
  'Seventh Sister',
  'Shaak Ti',
  'Shara Bey',
  'Shmi Skywalker',
  'Shu Mai',
  'Sidon Ithano',
  'Sifo-Dyas',
  'Sim Aloo',
  'Siniir Rath Velus',
  'Sio Bibble',
  'Sixth Brother',
  'Slowen Lo',
  'Sly Moore',
  'Snaggletooth',
  'Snap Wexley',
  'Snoke',
  'Sola Naberrie',
  'Sora Bulq',
  'Strono Tuggs',
  'Sy Snootles',
  'Tallissan Lintra',
  'Tarfful',
  'Tasu Leech',
  'Taun We',
  'TC-14',
  'Tee Watt Kaa',
  'Teebo',
  'Teedo',
  'Teemto Pagalies',
  'Temiri Blagg',
  'Tessek',
  'Tey How',
  'Thane Kyrell',
  'The Bendu',
  'The Smuggler',
  'Thrawn',
  'Tiaan Jerjerrod',
  'Tion Medon',
  'Tobias Beckett',
  'Tulon Voidgazer',
  'Tup',
  'U9-C4',
  'Unkar Plutt',
  'Val Beckett',
  'Vanden Willard',
  'Vice Admiral Amilyn Holdo',
  'Vober Dand',
  'WAC-47',
  'Wag Too',
  'Wald',
  'Walrus Man',
  'Warok',
  'Wat Tambor',
  'Watto',
  'Wedge Antilles',
  'Wes Janson',
  'Wicket W. Warrick',
  'Wilhuff Tarkin',
  'Wollivan',
  'Wuher',
  'Wullf Yularen',
  'Xamuel Lennox',
  'Yaddle',
  'Yarael Poof',
  'Yoda',
  'Zam Wesell',
  'Zev Senesca',
  'Ziro the Hutt',
  'Zuckuss',
]

function MentionComponent({ trigger, value, id, nodeKey }: {
  trigger: string
  value: string
  id: string
  nodeKey: NodeKey
}) {
  return (
    <span className="text-black bg-green px-[4px] rounded-[3px]">
      {trigger}
      {value}
    </span>
  )
}

export default function Editor() {
  const editorRef = useRef<LexicalEditor>(null)

  const [queryString, setQueryString] = useState<string | null>(null)

  const results = useMentionLookupService(queryString)

  const checkSlashMatch = useBasicTypeaheadTriggerMatch('/', {
    minLength: 0,
  })

  const checkMentionMatch = useBasicTypeaheadTriggerMatch('@', {
    minLength: 0,
  })

  function clearEditor() {
    const editor = editorRef.current
    if (!editor) return

    editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined)
  }

  const options: MentionOptions[] = useMemo(() => {
    return results.map(result => {
      return new MentionOptions(result, result)
    })
  }, [results])

  const onSelectOption = useMemoizedFn((
    selectedOption: MentionOptions,
    nodeToReplace: TextNode | null,
    closeMenu: () => void,
    matchingString: string
  ) => {
    const editor = editorRef.current
    if (!editor) return

    editor.update(() => {
      console.log('onSelectOption', selectedOption, nodeToReplace, closeMenu, matchingString)

      const mentionNode = $createMentionNode('@', selectedOption.label, selectedOption.key)

      console.log('nodeToReplace', nodeToReplace)
      if (nodeToReplace) {
        nodeToReplace.replace(mentionNode)
      }
      // mentionNode.select()
      closeMenu()
    })
  })

  function insertAt() {
    const editor = editorRef.current
    if (!editor) return

    editor.update(() => {
      const selection = $getSelection()

      selection?.insertText(' @')
    })
    // edito
  }

  return (
    <div className="h-full px-[12px] py-[12px] flex flex-col gap-[12px]">
      <div className="relative">
        <LexicalComposer initialConfig={initialConfig}>
          <PlainTextPlugin
            contentEditable={
              <ContentEditable className="outline-none z-1 focus:outline-green cursor-text text-[14px] leading-[21px] px-[16px] py-[6px] resize-none transition-all" />
            }
            ErrorBoundary={LexicalErrorBoundary}
            placeholder={
              <div className="absolute text-#bbbbbe w-max dark:text-[#5e5e60] select-none pointer-events-none text-[14px] text-ellipsis whitespace-nowrap top-[6px] left-[16px]">
                {'Placeholder'}
              </div>
            }
          />

          <LexicalTypeaheadMenuPlugin<MentionOptions>
            menuRenderFn={(anchorElementRef, itemProps, matchingString) => {
              if (!anchorElementRef.current || !results.length) return null
              return createPortal(
                <div className="bg-gray-8 absolute top-full text-gray-3 max-h-[400px] overflow-y-auto overflow-x-hidden">
                  {options.map((option, i) => (
                    <MentionsMenuItem
                      index={i}
                      isSelected={i === itemProps.selectedIndex}
                      onClick={() => {
                        itemProps.setHighlightedIndex(i)
                        itemProps.selectOptionAndCleanUp(option)
                      }}
                      onMouseEnter={() => {
                        itemProps.setHighlightedIndex(i)
                      }}
                      key={option.key}
                      option={option}
                    />
                  ))}
                </div>,
                anchorElementRef.current
              )
            }}
            onQueryChange={setQueryString}
            onSelectOption={onSelectOption}
            options={options}
            triggerFn={checkMentionMatch}
          />

          {/* Add `CLEAR_EDITOR_COMMAND` command support */}
          <ClearEditorPlugin />
          {/* Undo Redo */}
          <HistoryPlugin />
          {/* expose editor instance */}
          <EditorRefPlugin editorRef={editorRef} />
          {/* Auto focus */}
          <AutoFocusPlugin />
        </LexicalComposer>
      </div>

      <div className="flex gap-[10px]">
        <button className="btn" onClick={clearEditor}>Clear</button>
        <button className="btn" onClick={insertAt}>@</button>
      </div>
    </div>
  )
}
