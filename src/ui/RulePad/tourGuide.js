import React, {Component} from "react";
import {connect} from "react-redux";
import {constantRuleIndex} from "../uiConstants";
import Joyride, {ACTIONS, EVENTS} from "react-joyride";

import {updateDisplayEditTutorial} from "../../actions";

import {FaCheckSquare} from "react-icons/fa";
import {MdStar} from "react-icons/md";

import title_description_filled from "./resources/title_description_filled.png";
import visibility_class_declaration from "./resources/visibility_class_declaration.png";
import visibility_class_declaration_code from "./resources/visibility_class_declaration_code.png";
import constraint_example from "./resources/constraint_example.png";
import EoI_GUI_example_1 from "./resources/EoI_GUI_example_1.png";
import EoI_GUI_example_2 from "./resources/EoI_GUI_example_2.png";
import EoI_TE_example_1 from "./resources/EoI_TE_example_1.png";
import EoI_TE_example_2 from "./resources/EoI_TE_example_2.png";
import auto_complete_filled from "./resources/auto_complete_filled.png";
import auto_complete_info_icon from "./resources/auto_complete_info_icon.png";
import auto_complete_info from "./resources/auto_complete_info.png";
import auto_complete_example from "./resources/auto_complete_example.png";
import files_folders from "./resources/files_folders.png";
import tags from "./resources/tags.png";
import new_tag from "./resources/new_tag.png";
import feedback_snippet_1 from "./resources/feedback_snippet_1.png";
import matching_code from "./resources/matching_code.png";

class TourGuide extends Component {
    constructor(props) {
        super(props);

        this.ruleIndex = props["ruleIndex"] !== undefined ? props["ruleIndex"] : constantRuleIndex.newRuleIndex;

        this.tourGuideSteps = [
            {
                target: `#title_description_div_${this.ruleIndex}`,
                title: "Rule Title and Description",
                content: <span style={{textAlign: "left"}}>
                    <p>Each design rule should have a title by which it is displayed in the tool.
                        Design rule titles are often single-line statements about the rule.</p>
                    <p>Additional information about the rule and the rationale behind the decision,
                        can be expressed in the design rule description.</p>
                    <img className={"tutorialImage"} src={title_description_filled} alt={"Title Description Example"}
                        style={{width: "75%"}} />
                </span>,
                disableBeacon: true,
            }, // 0

            {
                target: `#gui_div_${this.ruleIndex}>.generateRuleGuiDiv`,
                title: "Graphical Editor for Writing Code",
                content: <span style={{textAlign: "left"}}>
                    <p>The Graphical Editor enables you to write code you want to match.</p>
                    <p>The Graphical Editor includes elements whose attributes can be modified. These elements corresponds to Java pieces of code.</p>
                </span>,
                disableBeacon: true,
            }, // 1
            {
                target: `#gui_div_${this.ruleIndex}>.generateRuleGuiDiv`,
                title: "The Graphical Editor Elements",
                content: <span style={{textAlign: "left"}}>
                    <p>For example, you can match the <strong>visibility</strong> property for class declaration statement.</p>
                    <div>
                        <div style={{display: "inline"}}>
                            <img className={"tutorialImage"}
                                src={visibility_class_declaration}
                                style={{width: "60%", maxHeight: "none"}}
                                alt={"Matching Element Example"} /></div>
                        <div style={{display: "inline", paddingLeft: "2%"}}>
                            <img className={"tutorialImage"}
                                src={visibility_class_declaration_code}
                                style={{width: "38%"}}
                                alt={"Matching Element Example"} /></div>
                    </div>
                </span>,
                disableBeacon: true,
            }, // 2
            {
                target: `#gui_div_${this.ruleIndex}>.generateRuleGuiDiv`,
                title: "Graphical Editor - Writing the Matching Code",
                content: <span style={{textAlign: "left"}}>
                    <p>Assume the following snippet is a pattern describing a commonality in the code:</p>
                    <code style={{float: "left", color: "#000"}}><span style={{color: "#666666"}}>package</span> <span
                        style={{color: "#7b611d"}}>com.bankapplication.controllers</span>;<br />
                        <span style={{color: "#a96324"}}>public </span>
                        <span style={{color: "#8b1a10"}}>class</span>{"... {"}<br />
                        {"    "}<span style={{backgroundColor: "#bfd9ff"}}>private static ..Controller ...;</span><br />
                        {"}"}
                    </code>
                    <p style={{clear: "both", paddingTop: "15px"}}>The rule corresponding to this pattern is applied <strong>when</strong> there is a <code>
                        <strong><span style={{color: "#a96324"}}>public</span> <span
                            style={{color: "#8b1a10"}}>class</span></strong></code> defined in <code><strong><span
                                style={{color: "#7b611d"}}>com.bankapplication.controllers</span></strong></code> package.</p>
                    <p>Now, write this code that you want to match in code using the Graphical Editor as follows.
                        The package can be considered as a folder which will be explained later.</p>
                    <img style={{width: "70%"}} className={"tutorialImage"} src={matching_code} alt={"Matching Code Element Example"} />
                </span>,
                disableBeacon: true,
            }, // 3
            {
                target: `#gui_div_${this.ruleIndex}>.generateRuleGuiDiv`,
                title: "Graphical Editor - Constraint Elements",
                content: <span style={{textAlign: "left"}}>
                    <p>In the next step, define <strong>what must be true</strong> and <strong>how</strong> the rule is satisfied.</p>
                    <code style={{float: "left", color: "#000"}}>package com.bankapplication.controllers;<br />
                        {"public class ... {"}<br />
                        {"    "}<strong><span style={{backgroundColor: "#bfd9ff"}}><span style={{color: "#2456c5"}}>{"private static"}</span><span style={{color: "#58803e"}}>...Controller</span> ...;</span></strong><br />
                        {"}"}
                    </code>

                    <p style={{clear: "both", paddingTop: "15px"}}>For the above pattern, we have the following rule:</p>
                    <p><strong>IF</strong> a <code><span style={{color: "#000"}}>public</span> <span
                        style={{color: "#000"}}>class</span></code> is defined in <code><span
                            style={{color: "#000"}}>com.bankapplication.controllers</span></code> package, <br />
                        <strong>THEN</strong> it should have a <code><strong><span
                            style={{color: "#2456c5"}}>private static</span></strong></code> field with <code><strong><span
                                style={{color: "#58803e"}}>...Controller</span></strong></code> type.</p>
                    <p>
                        <code><strong><span
                            style={{color: "#2456c5"}}>private static</span></strong></code> fields with <code><strong><span
                                style={{color: "#58803e"}}>...Controller</span></strong></code> type are called <span
                                    style={{backgroundColor: "#bfd9ff"}}>constraints</span>.
                    </p>

                    <p>The rule corresponding to this pattern is violated <strong>when</strong> a <code><span
                        style={{color: "#000"}}>public</span> <span style={{color: "#000"}}>class</span></code> is defined in <code><span
                            style={{color: "#000"}}>com.bankapplication.controllers</span></code> package, <strong>but</strong> does not have a <code><strong><span
                                style={{color: "#2456c5"}}>private static</span><span
                                    style={{color: "#58803e"}}>...Controller</span></strong></code> field.
                    </p>
                    <div style={{marginBottom: "10px"}}>Now, specify what must be true by writing code and switching them into <span
                        style={{backgroundColor: "#bfd9ff"}}>constraints</span> using checkboxes (
                        <div className={"switchContainer checkboxConstraint constraint"}>
                            <FaCheckSquare size={20} className={"react-icons"} />
                        </div>
                        ) in the Graphical Editor as follows.
                    </div>
                    <img className={"tutorialImage"} src={constraint_example} alt={"Constraint Element Example"} />
                </span>,
                disableBeacon: true,
            }, // 4
            {
                target: `#gui_div_${this.ruleIndex}>.generateRuleGuiDiv`,
                title: "The Graphical Editor - Element of Interest",
                content: <span style={{textAlign: "left"}}>
                    <p>In every design rule, one element is the most interesting element of the rule that is called <em>Element of Interest (EoI).</em>.</p>
                    <div>The Graphical Editor will select an EoI automatically (Marked by <div className={"MdStar selectedElement"} style={{display: "inline"}}><MdStar size={20} /></div>).
                        EoI can be changed using <div className={"MdStar"} style={{display: "inline"}}><MdStar size={20} className={"react-icons"} /></div></div>
                    <p>For example, consider the following scenarios.</p>

                    <div style={{width: "80%", marginLeft: "10%", marginBottom: "10px"}}>
                        <img className={"tutorialImage"} src={EoI_GUI_example_1} style={{marginBottom: "15px"}} alt={"EoI GUI Example 1"} />
                        <img className={"tutorialImage"} src={EoI_TE_example_1} alt={"EoI TE Example 1"} />
                    </div>

                    <p>Changing the EoI from <em>declaration statement</em> to <em>class</em> changes the rule, and as a result, code snippets.</p>

                    <div style={{width: "80%", marginLeft: "10%"}}>
                        <img className={"tutorialImage"} src={EoI_GUI_example_2} style={{marginBottom: "15px"}} alt={"EoI GUI Example 2"} />
                        <img className={"tutorialImage"} src={EoI_TE_example_2} alt={"EoI TE Example 2"} />
                    </div>

                </span>,
                disableBeacon: true,
            }, // 5

            {
                target: `#text_ui_div_${this.ruleIndex}`,
                title: "Writing a Design Rule",
                content: <span style={{textAlign: "left"}}>
                    <p>You can write design rules here.</p>
                    <p>The text editor includes features such as Auto-Complete which helps to write design rules.
                        It can be activated using <kbd>CTRL</kbd>+<kbd>Space</kbd></p>
                    <img className={"tutorialImage"} src={auto_complete_filled} alt={"Auto Complete Example"} />

                </span>,
                disableBeacon: true,
            }, // 6
            {
                target: `#text_ui_div_${this.ruleIndex}`,
                title: "Text Editor - Auto Complete",
                content: <span style={{textAlign: "left"}}>
                    <p>Some suggestions include additional information which provides information on the suggestion.
                        It can be activated using <kbd>CTRL</kbd>+<kbd>Space</kbd> or <img style={{height: "1.1em"}}
                            src={auto_complete_info_icon}
                            alt={"Auto Complete Information Icon"} /></p>
                    <img className={"tutorialImage"} src={auto_complete_info}
                        alt={"Auto Complete Information Example"} />
                </span>,
                disableBeacon: true,
            }, // 7

            {
                target: `#text_ui_div_${this.ruleIndex}`,
                title: "Text Editor - Link to the Graphical Editor",
                content: <span style={{textAlign: "left"}}>
                    <p>Hovering over the text in the editor will display information about the text and highlight the Graphical Editor element if applicable.</p>
                    <img className={"tutorialImage"} src={auto_complete_example} alt={"Auto Complete Hover Example"}
                        style={{height: "300px", maxHeight: "none"}} />
                </span>,
                disableBeacon: true,
            }, // 8

            {
                target: `#tag_div_${this.ruleIndex}`,
                content: <span style={{textAlign: "left"}}>
                    <p>Tags are used to organize design rules. Related design rules may have similar tags.</p>
                    <p><strong>Tags</strong> can be assigned to each design rule.</p>
                    <img className={"tutorialSmallImage"} src={tags} alt={"Tags Example"} />
                    <p>New tags can be generated here as well.</p>
                    <img className={"tutorialImage"} src={new_tag} alt={"New Tag Example"} />
                </span>,
                title: "Rule Tags",
                disableBeacon: true,
            }, // 9
            {
                target: `#file_constraint_div_${this.ruleIndex}`,
                content: <span style={{textAlign: "left"}}>
                    <p>Some rules may be applied to specific files or folders. For example, a rule may be applied on a specific package
                        <span style={{color: "#7b611d"}}> com.bankapplication.controllers</span>. The respective path of this package in the project is specified here:</p>
                    <img style={{marginBottom: "20px"}} src={files_folders} className={"tutorialImage"} alt={"Specific file and folders"} />
                </span>,
                title: "Specifying Files and Folders",
                disableBeacon: true,
            }, // 10

            {
                target: `#feedback_snippet_div_${this.ruleIndex}`,
                content: <span style={{textAlign: "left"}}>
                    <p>The code is checked against the design rule and the result of the validation is visible before submitting the design rule.</p>
                    <img className={"tutorialImage"}
                        src={feedback_snippet_1}
                        style={{width: "50%"}}
                        alt={"Feedback Snippets Example 1"} />
                </span>,
                title: "FeedBack",
                disableBeacon: true,
            }, // 11
        ];

        this.state = {
            tourMainKey: props["tourMainIndex"],
            tourStepIndex: props["tourStepIndex"],
            tourShouldRun: props["tourShouldRun"],
            isTourGuide: props["isTourGuide"],
        };
    }

    render() {
        return (
            <Joyride
                key={this.state.tourMainKey}
                run={this.state.tourShouldRun}
                steps={this.tourGuideSteps}

                showSkipButton={this.state.isTourGuide}
                showProgress={this.state.isTourGuide}
                continuous={this.state.isTourGuide}
                hideBackButton={!this.state.isTourGuide}

                stepIndex={this.state.tourStepIndex}
                disableCloseOnEsc={true}
                spotlightPadding={5}

                callback={(tourData) => {
                    if (tourData.action === ACTIONS.CLOSE) {
                        this.setState({
                            tourMainKey: this.state.tourMainKey + 1,
                            tourShouldRun: false,
                            tourStepIndex: this.state.isTourGuide ? this.state.tourStepIndex : 0,
                        }, () => this.props.onUpdateDisplayEditTutorial(false));
                    } else if (tourData.type === EVENTS.TOUR_END) {
                        this.setState({
                            tourMainKey: this.state.tourMainKey + 1,
                            tourStepIndex: 0,
                            tourShouldRun: false,
                        });
                    } else if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(tourData.type)) {
                        const nextIndex = tourData.index + (tourData.action === ACTIONS.PREV ? -1 : 1);
                        this.setState({tourStepIndex: nextIndex});
                    }
                }}

                floaterProps={{disableAnimation: true}}

                styles={{
                    options: {
                        primaryColor: "#000",
                        width: 900,
                        zIndex: 1000,
                    },
                }}
            />
        )
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        this.setState({
            isTourGuide: nextProps.isTourGuide,
            tourMainKey: nextProps.tourMainKey,
            tourShouldRun: nextProps.tourShouldRun,
            tourStepIndex: nextProps.tourStepIndex
        });
    }
}

function mapStateToProps(state) {
    return {
    };
}

function mapDispatchToProps(dispatch) {
    return {
        onUpdateDisplayEditTutorial: (value) => dispatch(updateDisplayEditTutorial(value)),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(TourGuide);